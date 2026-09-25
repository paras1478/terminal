import { UnauthorizedException } from '@nestjs/common';

/**
 * Thrown when an OAuth callback's profile email has no matching User row.
 * Distinguished from a generic UnauthorizedException so callers (the OAuth
 * redirect flow) can surface a specific "account_deleted" error to the
 * frontend instead of the generic oauth_failed.
 */
export class OAuthAccountDeletedException extends UnauthorizedException {
  constructor() {
    super(
      'This account no longer exists. Please register again to create a new account.',
    );
  }
}
