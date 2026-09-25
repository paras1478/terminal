"use client";

import { useState } from "react";
import Link from "next/link";
import { completeOAuthRegistration, ApiError } from "@/lib/api/auth";

/**
 * Shown on /register?oauthPending=...&oauthEmail=... when the OAuth callback
 * (backend AuthController.googleCallback -> AuthService.loginWithOAuth)
 * found no existing application User for the chosen Google account. Google
 * authenticating successfully is NOT treated as proof an account should
 * exist or be recreated — this screen requires an explicit click before any
 * User row is created, matching the same "user must actually register"
 * intent as the email/password form beside it.
 */
export function OAuthRegisterConfirm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleCreateAccount() {
    setStatus("pending");
    setError(null);
    try {
      const { code } = await completeOAuthRegistration(token);
      window.location.href = `/auth/callback?code=${encodeURIComponent(code)}`;
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div className="space-y-4 rounded-md border border-default panel-bg p-4">
      <div>
        <p className="text-sm font-medium text-primary">No account found</p>
        <p className="mt-1 text-sm text-secondary">
          There&apos;s no AI Terminal account for{" "}
          <span className="text-primary">{email}</span> yet. Create one to
          continue with this Google account.
        </p>
      </div>

      {status === "error" && error && (
        <p
          role="alert"
          className="rounded-md border border-error/30 bg-error-subtle px-3 py-2 text-sm text-error"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleCreateAccount}
        disabled={status === "pending"}
        aria-busy={status === "pending"}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "pending"
          ? "Creating account…"
          : `Create account as ${email}`}
      </button>

      <p className="text-center text-sm text-muted">
        Not you?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline hover:text-accent-hover"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
}
