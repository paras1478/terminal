"use client";

/**
 * Client-safe settings API calls. dashboard.ts's request() helper reads the
 * access token via next/headers (server-only), so it cannot be called from a
 * client component. These take the token as an explicit argument instead,
 * following the same pattern session-terminal.tsx uses for its socket
 * connection (server component fetches the token, passes it down as a prop).
 */

import { env } from "@/lib/env";
import type { Settings } from "@/lib/api/dashboard";

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
    // ignore
  }
  return "Something went wrong. Please try again.";
}

export async function deleteApiKeyClient(accessToken: string, provider: string): Promise<Settings> {
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/settings/api-keys/${encodeURIComponent(provider)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as Settings;
}

export async function validateApiKeyClient(
  accessToken: string,
  provider: string,
  apiKey: string,
): Promise<{ valid: boolean; message?: string }> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/settings/api-keys/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ provider, apiKey }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as { valid: boolean; message?: string };
}
