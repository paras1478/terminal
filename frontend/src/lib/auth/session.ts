import "server-only";
import { cookies } from "next/headers";
import type { AuthResponse, User } from "@/lib/schemas/auth";

export const COOKIE_NAMES = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  user: "user",
} as const;

type CookieKind = "access" | "refresh" | "user";

const MAX_AGE_SECONDS: Record<CookieKind, number> = {
  access: 60 * 15,
  refresh: 60 * 60 * 24 * 7,
  user: 60 * 60 * 24 * 7,
};

/**
 * Shared cookie options for both createSession() below (called from Server
 * Actions triggered by a real form submission — login/register) and the
 * OAuth callback Route Handler (app/auth/callback/route.ts), which sets
 * cookies directly on its NextResponse instead of via next/headers'
 * cookies(). Keeping this in one place means the two call sites can't drift.
 */
export function cookieOptionsFor(kind: CookieKind) {
  return {
    httpOnly: kind !== "user",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS[kind],
  };
}

export async function createSession(auth: AuthResponse): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAMES.accessToken, auth.accessToken, cookieOptionsFor("access"));
  cookieStore.set(COOKIE_NAMES.refreshToken, auth.refreshToken, cookieOptionsFor("refresh"));
  cookieStore.set(COOKIE_NAMES.user, JSON.stringify(auth.user), cookieOptionsFor("user"));
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.accessToken);
  cookieStore.delete(COOKIE_NAMES.refreshToken);
  cookieStore.delete(COOKIE_NAMES.user);
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.accessToken)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.refreshToken)?.value;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAMES.user)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
