import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private get frontendOrigin(): string {
    return this.configService.get<string>('CORS_ORIGIN') ?? 'https://terminal-1-riuw.onrender.com';
  }

  private async redirectWithOAuthResult(
    res: Response,
    profile: OAuthProfile | undefined,
  ): Promise<void> {
    if (!profile) {
      res.redirect(`${this.frontendOrigin}/login?error=oauth_failed`);
      return;
    }
    try {
      const code = await this.authService.loginWithOAuth(profile);
      res.redirect(`${this.frontendOrigin}/auth/callback?code=${encodeURIComponent(code)}`);
    } catch {
      res.redirect(`${this.frontendOrigin}/login?error=oauth_failed`);
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
    await this.redirectWithOAuthResult(res, req.user as OAuthProfile | undefined);
  }
}
