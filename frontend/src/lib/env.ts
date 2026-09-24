import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

/**
 * Base URL for REST calls to the backend. The backend's HTTP routes all live
 * under /api/v1 (see backend/src/main.ts's app.setGlobalPrefix) — Socket.IO
 * gateways (terminal/agent/files) are NOT affected by that prefix, so socket
 * connections must keep using env.NEXT_PUBLIC_API_URL directly, not this.
 */
export const API_BASE_URL = `${env.NEXT_PUBLIC_API_URL}/api/v1`;

/**
 * This app's own public origin (protocol + host), when explicitly known.
 * Used by the OAuth callback route (app/auth/callback/route.ts) to build its
 * final redirect instead of trusting an incoming request's reported
 * scheme/host, so a misbehaving proxy — or a browser that has incorrectly
 * cached an HTTPS upgrade for a plain-HTTP local dev origin — can't send
 * that redirect to the wrong scheme (producing ERR_SSL_PROTOCOL_ERROR against
 * next dev's plain-HTTP server). Undefined unless explicitly set: the
 * consuming code falls back to deriving the origin from the request when
 * this isn't set, so production is unaffected unless you choose to set it
 * there too.
 */
export const APP_URL = env.NEXT_PUBLIC_APP_URL;
