"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser, ApiError } from "@/lib/api/auth";
import { clearSessionAction } from "@/lib/auth/actions";

const POLL_INTERVAL_MS = 60_000;

/**
 * Safety-net authentication poller, additional to (not a replacement for)
 * the real auth check DashboardLayout already runs on every server render
 * (see app/dashboard/layout.tsx). That server check only fires on navigation
 * or a hard refresh — if a user's MongoDB account is deleted while they're
 * already sitting on a dashboard page doing nothing, nothing re-runs it. This
 * component re-validates the session against GET /auth/me (the same
 * backend-authoritative, DB-checked endpoint) every 60s so a mid-session
 * deletion gets caught without requiring the user to navigate or refresh.
 *
 * Mounted once by DashboardLayout, so it only ever runs on /dashboard/*
 * routes and never on /login.
 */
export function AuthPoller({ accessToken }: { accessToken: string }) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Guards against a second interval ever being created (e.g. React
    // Strict Mode's dev-only double-invoke of effects) — only one poll loop
    // may be active per mounted instance.
    if (intervalRef.current !== null) {
      return;
    }

    let cancelled = false;

    const checkAuth = async () => {
      try {
        await fetchCurrentUser(accessToken);
        // 200: session still valid — nothing to do. (currentUser itself
        // isn't held in client state anywhere in this app; the server
        // components re-fetch it on navigation, so there's nothing to
        // update here beyond confirming the session is still good.)
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          await clearSessionAction();
          if (!cancelled) {
            router.replace("/login");
          }
        }
        // Non-401 errors (e.g. a transient network blip) are ignored here —
        // the backend's /auth/me response is authoritative only when it
        // actually answers; a failed request isn't evidence the account is
        // gone, and retrying next interval is the correct behavior.
      }
    };

    intervalRef.current = setInterval(checkAuth, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [accessToken, router]);

  return null;
}
