import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { OAuthProfile } from './oauth-profile.type';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    // Falls back to placeholder values instead of throwing at boot: if these
    // env vars aren't configured, the /auth/google routes will simply fail
    // when actually used (Google will reject the placeholder client ID)
    // rather than crashing the entire backend for every other feature.
    const callbackURL =
      configService.get<string>('GOOGLE_CALLBACK_URL') ??
      'http://localhost:3000/auth/google/callback';
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') ?? 'not-configured';

    // TEMPORARY diagnostic logging for the OAuth login failure investigation.
    // Never logs GOOGLE_CLIENT_SECRET. Logs at boot time so you can compare
    // this exact runtime value against Google Cloud Console's authorized
    // redirect URI without guessing what env var Render actually applied.
    new Logger('GoogleStrategy').log(
      `[oauth] configured callbackURL=${callbackURL} clientID=${clientID === 'not-configured' ? 'NOT CONFIGURED' : `${clientID.slice(0, 12)}...`}`,
    );

    super({
      clientID,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ?? 'not-configured',
      callbackURL,
      scope: ['profile', 'email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Google account has no email'), undefined);
      return;
    }

    const oauthProfile: OAuthProfile = {
      provider: 'GOOGLE',
      providerId: profile.id,
      email,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      avatarUrl: profile.photos?.[0]?.value,
    };
    done(null, oauthProfile);
  }
}
