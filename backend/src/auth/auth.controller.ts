import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ExchangeOAuthCodeDto } from './dto/exchange-oauth-code.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { OAuthProfile } from './strategies/oauth-profile.type';

// Frontend origins this backend is allowed to redirect an OAuth login back
// to. CORS_ORIGIN remains the default/production target; ADDITIONAL_OAUTH_
// RETURN_ORIGINS (comma-separated) lets local/Electron dev clients opt in
// via ?returnTo=<origin> on /auth/google (see GoogleAuthGuard) without ever
// letting an arbitrary attacker-supplied URL become a redirect target.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private get frontendOrigin(): string {
    return this.configService.get<string>('CORS_ORIGIN') ?? 'https://terminal-1-riuw.onrender.com';
  }

  private get allowedReturnOrigins(): string[] {
    const extra = this.configService.get<string>('ADDITIONAL_OAUTH_RETURN_ORIGINS') ?? '';
    const origins = extra
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    return [this.frontendOrigin, ...origins];
  }

  /** Validates a `state`-carried return origin against the allowlist, falling back to frontendOrigin. */
  private resolveReturnOrigin(stateOrigin: unknown): string {
    if (typeof stateOrigin === 'string' && this.allowedReturnOrigins.includes(stateOrigin)) {
      return stateOrigin;
    }
    return this.frontendOrigin;
  }

  private async redirectWithOAuthResult(
    req: Request,
    res: Response,
    profile: OAuthProfile | undefined,
  ): Promise<void> {
    const returnOrigin = this.resolveReturnOrigin(req.query.state);

    // TEMPORARY diagnostic logging for the OAuth login failure investigation.
    // Never logs GOOGLE_CLIENT_SECRET, access/refresh tokens, or passwords.
    this.logger.log(`[oauth] callback reached, returnOrigin=${returnOrigin}`);

    if (!profile) {
      this.logger.warn('[oauth] Passport guard produced no profile — Google auth itself did not complete');
      res.redirect(`${returnOrigin}/login?error=oauth_failed`);
      return;
    }
    try {
      const code = await this.authService.loginWithOAuth(profile);
      res.redirect(`${returnOrigin}/auth/callback?code=${encodeURIComponent(code)}`);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`[oauth] redirectWithOAuthResult failed: ${error.name}: ${error.message}`, error.stack);
      res.redirect(`${returnOrigin}/login?error=oauth_failed`);
    }
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a one-time OAuth redirect code for a real token pair',
  })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  exchangeOAuthCode(@Body() dto: ExchangeOAuthCodeDto): AuthResponseDto {
    return this.authService.exchangeOAuthCode(dto.code);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  googleLogin(): void {
    // Guard redirects to Google; this handler body never runs.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.redirectWithOAuthResult(req, res, req.user as OAuthProfile | undefined);
  }
}
