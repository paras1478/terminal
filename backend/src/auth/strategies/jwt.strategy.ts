import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Runs on every request to a JwtAuthGuard-protected route. A cryptographically
   * valid JWT only proves the token was issued by us and hasn't expired — it
   * says nothing about whether the account it names still exists. Access
   * tokens here live for up to a year (JWT_ACCESS_EXPIRES_IN), so without this
   * check, deleting a user from the database would NOT revoke their existing
   * session: every already-issued token would keep working until it expired
   * on its own, up to a year later. Querying the user on every request is the
   * only way a deletion (or a ban, etc.) takes effect immediately.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('This account no longer exists.');
    }

    return payload;
  }
}
