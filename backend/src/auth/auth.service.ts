import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { OAuthProfile } from './strategies/oauth-profile.type';

const BCRYPT_SALT_ROUNDS = 12;
const OAUTH_CODE_TTL_MS = 60_000;
const OAUTH_PENDING_REGISTRATION_TTL_MS = 5 * 60_000;

/**
 * Result of an OAuth callback lookup: either the Google identity already
 * matches an application User (`kind: 'login'`, code exchanged the normal
 * way via exchangeOAuthCode), or it doesn't (`kind: 'pending_registration'`)
 * and the caller must send the browser into the explicit registration
 * confirmation flow — see completeOAuthRegistration().
 */
export type OAuthLoginResult =
  | { kind: 'login'; code: string }
  | { kind: 'pending_registration'; token: string; email: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // A user who signed up via Google has no passwordHash — they must use
    // that provider (or set a password from Settings first) rather than
    // getting a confusing bcrypt error here.
    const isValid =
      user?.passwordHash != null
        ? await bcrypt.compare(dto.password, user.passwordHash)
        : false;

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.buildAuthResponse(user);
  }

  // sessionId -> pending AuthResponseDto, consumed exactly once. Redirect-based
  // OAuth can't hand tokens back in the URL (browser history, referrer headers,
  // server logs would all see them), so the callback stores the real token pair
  // here and redirects the browser with only a short-lived opaque code; the
  // frontend immediately exchanges that code server-side for the real tokens.
  private readonly pendingOAuthCodes = new Map<
    string,
    { auth: AuthResponseDto; expiresAt: number }
  >();

  // token -> the Google profile awaiting explicit user confirmation before a
  // new User row is created. See loginWithOAuth's 'pending_registration' case
  // and completeOAuthRegistration(). Kept separate from pendingOAuthCodes
  // (which already holds a *finished* login) since this map holds an
  // unconsummated OAuth profile, not yet-issued tokens.
  private readonly pendingOAuthRegistrations = new Map<
    string,
    { profile: OAuthProfile; expiresAt: number }
  >();

  /**
   * Finds a User for this OAuth profile (matching by email, so a user who
   * later signs in with another linked provider lands in the same account).
   * If found, links the OAuthAccount if not already linked and returns a
   * one-time login code (exchanged via exchangeOAuthCode()). If not found,
   * returns a one-time pending-registration token instead — the caller must
   * send the browser to an explicit registration-confirmation step
   * (completeOAuthRegistration()) rather than treating Google's success as
   * proof an application account should exist.
   *
   * Deliberately does NOT create a new User here. Google can complete OAuth
   * silently (no consent screen) for an account whose Google-side grant is
   * still active even after we've deleted the corresponding User row — so
   * "no User found" during OAuth must never silently recreate the account;
   * it must go through the same explicit, user-initiated registration step
   * a brand-new signup would.
   */
  async loginWithOAuth(profile: OAuthProfile): Promise<OAuthLoginResult> {
    // TEMPORARY diagnostic logging for the OAuth login failure investigation.
    // Never logs GOOGLE_CLIENT_SECRET, access/refresh tokens, API keys, or
    // passwords — only the profile email (safe: it's the user's own account
    // identifier, already visible to them) and boolean/step markers.
    this.logger.log(
      `[oauth] profile received: provider=${profile.provider} providerId=${profile.providerId ? 'present' : 'MISSING'} email=${profile.email ?? 'MISSING'}`,
    );

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
      this.logger.log(
        `[oauth] user lookup: ${user ? 'found existing user' : 'no existing user'}`,
      );

      if (!user) {
        this.logger.warn(
          '[oauth] no User exists for this email (deleted, or never registered) — routing to pending registration',
        );
        const token = randomUUID();
        this.pendingOAuthRegistrations.set(token, {
          profile,
          expiresAt: Date.now() + OAUTH_PENDING_REGISTRATION_TTL_MS,
        });
        this.cleanupExpiredPendingRegistrations();
        return { kind: 'pending_registration', token, email: profile.email };
      }

      await this.prisma.oAuthAccount.upsert({
        where: {
          provider_providerId: {
            provider: profile.provider,
            providerId: profile.providerId,
          },
        },
        update: { userId: user.id },
        create: {
          userId: user.id,
          provider: profile.provider,
          providerId: profile.providerId,
        },
      });
      this.logger.log('[oauth] oauthAccount upsert: succeeded');

      const auth = await this.buildAuthResponse(user);
      this.logger.log('[oauth] JWT generation: succeeded');

      const code = this.mintOAuthCode(auth);
      this.logger.log(
        `[oauth] one-time code minted, pendingOAuthCodes size=${this.pendingOAuthCodes.size}`,
      );

      return { kind: 'login', code };
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `[oauth] loginWithOAuth failed: ${error.name}: ${error.message}`,
        error.stack,
      );
      throw err;
    }
  }

  /**
   * Creates a new User (+ linked OAuthAccount) for a pending OAuth
   * registration token minted by loginWithOAuth(), and returns a one-time
   * login code the same way a normal OAuth login would. Only ever called
   * from the explicit "Create account" confirmation the frontend shows for
   * a Google identity with no existing application account — never
   * automatically from the OAuth callback itself.
   */
  async completeOAuthRegistration(token: string): Promise<string> {
    const entry = this.pendingOAuthRegistrations.get(token);
    this.pendingOAuthRegistrations.delete(token);

    if (!entry || entry.expiresAt < Date.now()) {
      this.logger.warn(
        `[oauth] completeOAuthRegistration failed: ${!entry ? 'token not found (wrong process instance, or already consumed)' : 'token expired'}`,
      );
      throw new NotFoundException(
        'This registration link has expired or was already used. Please try "Continue with Google" again.',
      );
    }

    const { profile } = entry;

    // Re-check for a race: another request (e.g. a concurrent login, or the
    // user double-clicking "Create account") may have created this User
    // between the original OAuth callback and this confirmation.
    const existing = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    const user =
      existing ??
      (await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
        },
      }));
    this.logger.log(
      `[oauth] completeOAuthRegistration: ${existing ? 'used existing user (race)' : 'user creation succeeded'}`,
    );

    await this.prisma.oAuthAccount.upsert({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      update: { userId: user.id },
      create: {
        userId: user.id,
        provider: profile.provider,
        providerId: profile.providerId,
      },
    });

    const auth = await this.buildAuthResponse(user);
    return this.mintOAuthCode(auth);
  }

  /** Consumes a one-time OAuth code (see loginWithOAuth), returning the real token pair exactly once. */
  exchangeOAuthCode(code: string): AuthResponseDto {
    const entry = this.pendingOAuthCodes.get(code);
    this.pendingOAuthCodes.delete(code);

    if (!entry || entry.expiresAt < Date.now()) {
      this.logger.warn(
        `[oauth] exchangeOAuthCode failed: ${!entry ? 'code not found (wrong process instance, or already consumed)' : 'code expired'}, pendingOAuthCodes size=${this.pendingOAuthCodes.size}`,
      );
      throw new UnauthorizedException(
        'This sign-in link has expired or was already used.',
      );
    }
    this.logger.log('[oauth] exchangeOAuthCode: succeeded');
    return entry.auth;
  }

  private mintOAuthCode(auth: AuthResponseDto): string {
    const code = randomUUID();
    this.pendingOAuthCodes.set(code, {
      auth,
      expiresAt: Date.now() + OAUTH_CODE_TTL_MS,
    });
    this.cleanupExpiredCodes();
    return code;
  }

  private cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [code, entry] of this.pendingOAuthCodes) {
      if (entry.expiresAt < now) {
        this.pendingOAuthCodes.delete(code);
      }
    }
  }

  private cleanupExpiredPendingRegistrations(): void {
    const now = Date.now();
    for (const [token, entry] of this.pendingOAuthRegistrations) {
      if (entry.expiresAt < now) {
        this.pendingOAuthRegistrations.delete(token);
      }
    }
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
    role: string;
  }): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    };
  }
}
