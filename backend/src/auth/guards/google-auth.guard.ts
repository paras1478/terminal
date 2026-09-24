import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/**
 * Extends the base google AuthGuard so the initial /auth/google request can
 * carry a `returnTo` query param (an allowlisted frontend origin — see
 * ALLOWED_RETURN_ORIGINS in auth.controller.ts) through Google's OAuth
 * `state` parameter and back out the other side on /auth/google/callback.
 *
 * This exists because a single deployed backend needs to redirect back to
 * different frontends depending on who initiated the login — the real
 * production site, or a local dev/Electron client testing against this same
 * deployed backend — without a human manually flipping CORS_ORIGIN on
 * Render every time. Google returns the `state` value unchanged per the
 * OAuth 2.0 spec (RFC 6749 §4.1.1/§4.1.2), so no server-side state store is
 * needed for this — the controller validates it against an allowlist before
 * ever using it as a redirect target, so this can't be used to redirect to
 * an arbitrary attacker-controlled URL.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const returnTo = typeof request.query.returnTo === 'string' ? request.query.returnTo : undefined;
    return returnTo ? { state: returnTo } : {};
  }
}
