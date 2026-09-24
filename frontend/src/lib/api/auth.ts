import { API_BASE_URL } from "@/lib/env";
import {
  authResponseSchema,
  userSchema,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
  type User,
} from "@/lib/schemas/auth";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
    ) {
      return (body as { message: string }).message;
    }
  } catch {
    // response body was not JSON; fall through to default message
  }
  return "Something went wrong. Please try again.";
}

async function postAuth(
  path: "/auth/register" | "/auth/login" | "/auth/refresh" | "/auth/oauth/exchange",
  payload: unknown,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return authResponseSchema.parse(await response.json());
}

export function registerUser(input: RegisterInput): Promise<AuthResponse> {
  return postAuth("/auth/register", {
    email: input.email,
    password: input.password,
    firstName: input.firstName || undefined,
    lastName: input.lastName || undefined,
  });
}

export function loginUser(input: LoginInput): Promise<AuthResponse> {
  return postAuth("/auth/login", input);
}

export function refreshSession(refreshToken: string): Promise<AuthResponse> {
  return postAuth("/auth/refresh", { refreshToken });
}

/** Exchanges the one-time code from the /auth/google/callback redirect for a real token pair. */
export function exchangeOAuthCode(code: string): Promise<AuthResponse> {
  return postAuth("/auth/oauth/exchange", { code });
}

/**
 * Real, backend-validated "am I still logged in" check. Unlike reading the
 * `user` cookie (which is just whatever was written at login time and proves
 * nothing about the account's current state), this hits GET /auth/me, which
 * is guarded by JwtAuthGuard/JwtStrategy — that guard queries the database on
 * every call and rejects with 401 if the account no longer exists, so a
 * deleted user's still-unexpired access token is correctly treated as invalid
 * here. Throws ApiError(401) when the token is missing/invalid/expired or the
 * account was deleted; callers must treat any throw as "not authenticated."
 */
export async function fetchCurrentUser(accessToken: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return userSchema.parse(await response.json());
}
