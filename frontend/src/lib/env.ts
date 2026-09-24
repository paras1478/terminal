import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

/**
 * Base URL for REST calls to the backend. The backend's HTTP routes all live
 * under /api/v1 (see backend/src/main.ts's app.setGlobalPrefix) — Socket.IO
 * gateways (terminal/agent/files) are NOT affected by that prefix, so socket
 * connections must keep using env.NEXT_PUBLIC_API_URL directly, not this.
 */
export const API_BASE_URL = `${env.NEXT_PUBLIC_API_URL}/api/v1`;
