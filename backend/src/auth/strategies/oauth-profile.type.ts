/** Normalized shape an OAuth strategy produces, regardless of provider. */
export interface OAuthProfile {
  provider: 'GOOGLE';
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}
