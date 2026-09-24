import { NextRequest, NextResponse } from "next/server";
import { exchangeOAuthCode } from "@/lib/api/auth";
import { COOKIE_NAMES, cookieOptionsFor } from "@/lib/auth/session";
import { APP_URL } from "@/lib/env";

/**
 * Landing point for the backend's OAuth redirect
 * (backend/src/auth/auth.controller.ts's googleCallback, which sends the
 * browser here as /auth/callback?code=...).
 *
 * This MUST be a Route Handler, not a page/Server Component. Next.js only
 * allows setting cookies from a Route Handler, Middleware, or a Server
 * Action invoked by a real form submission — never from a plain page's
 * render. The previous implementation was a page component that called
 * cookies().set() (via createSession) directly in its render body, which
 * Next.js rejects with an opaque server error (the "Error 3861673156"
 * digest) — it never reached the point of actually setting a cookie.
 *
 * The final redirect targets are built from APP_URL (an explicit
 * NEXT_PUBLIC_APP_URL env var) when it's set, falling back to this
 * request's own URL otherwise. Preferring an explicit value guards against
 * a reverse proxy that mis-sets X-Forwarded-Proto, or a browser that has
 * (incorrectly) cached an HTTPS upgrade for a plain-HTTP local dev origin —
 * either of which can make request.url report "https://localhost:3001" even
 * though next dev only ever serves plain HTTP, producing
 * ERR_SSL_PROTOCOL_ERROR on redirect since nothing is listening for TLS on
 * that port.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const origin = APP_URL ?? request.url;
  const dashboardUrl = new URL("/dashboard", origin);
  const loginErrorUrl = new URL("/login?error=oauth_failed", origin);

  if (!code) {
    return NextResponse.redirect(loginErrorUrl);
  }

  let auth;
  try {
    auth = await exchangeOAuthCode(code);
  } catch {
    return NextResponse.redirect(loginErrorUrl);
  }

  const response = NextResponse.redirect(dashboardUrl);

  response.cookies.set(COOKIE_NAMES.accessToken, auth.accessToken, cookieOptionsFor("access"));
  response.cookies.set(COOKIE_NAMES.refreshToken, auth.refreshToken, cookieOptionsFor("refresh"));
  response.cookies.set(COOKIE_NAMES.user, JSON.stringify(auth.user), cookieOptionsFor("user"));

  return response;
}
