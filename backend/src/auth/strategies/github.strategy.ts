import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { OAuthProfile } from './oauth-profile.type';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    // Falls back to placeholder values instead of throwing at boot: until real
    // GitHub OAuth App credentials are configured, /auth/github will fail
    // when actually used rather than crashing the entire backend.
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') ?? 'not-configured',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') ?? 'not-configured',
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ??
        'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: OAuthProfile) => void,
  ): void {
    // GitHub only includes emails[] when the user has a public email OR the
    // user:email scope is granted and returns their primary verified email —
    // it can still legitimately be empty for accounts with no verified email.
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Your GitHub account has no accessible email address. Please make an email public or verify one on GitHub, then try again.'));
      return;
    }

    const [firstName, ...rest] = (profile.displayName ?? profile.username ?? '').split(' ');

    const oauthProfile: OAuthProfile = {
      provider: 'GITHUB',
      providerId: profile.id,
      email,
      firstName: firstName || undefined,
      lastName: rest.length > 0 ? rest.join(' ') : undefined,
      avatarUrl: profile.photos?.[0]?.value,
    };
    done(null, oauthProfile);
  }
}
