import { NextRequest, NextResponse } from "next/server";
import { exchangeOAuthCode } from "@/lib/api/auth";
import { COOKIE_NAMES, cookieOptionsFor } from "@/lib/auth/session";

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
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const dashboardUrl = new URL("/dashboard", request.url);
  const loginErrorUrl = new URL("/login?error=oauth_failed", request.url);

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
