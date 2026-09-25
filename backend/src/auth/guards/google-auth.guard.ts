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
 *
 * Also forces Google's account-chooser screen via `prompt: 'select_account'`
 * on every /auth/google request. Without this, Google can silently reuse an
 * existing browser session/grant and skip straight to the callback with
 * whichever Google account is already signed in — which is surprising when
 * the user just saw "this account no longer exists" and clicks
 * "Continue with Google" expecting a chance to pick a (possibly different)
 * account. This only affects which Google account the user is asked to
 * choose; it has no bearing on whether that Google identity maps to an
 * existing application User — that check still happens entirely in
 * AuthService.loginWithOAuth.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const returnTo =
      typeof request.query.returnTo === 'string'
        ? request.query.returnTo
        : undefined;
    return {
      prompt: 'select_account',
      ...(returnTo ? { state: returnTo } : {}),
    };
  }
}
