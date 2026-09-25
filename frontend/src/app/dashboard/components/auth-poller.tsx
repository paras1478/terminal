"use client";

import { useEffect, useRef } from "react";
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
      // TEMPORARY debug logging for the "poller doesn't redirect after
      // MongoDB user deletion" investigation. Remove once confirmed fixed.
      console.log("[AUTH POLL] request start", new Date().toISOString());
      try {
        await fetchCurrentUser(accessToken);
        console.log("[AUTH POLL] response 200 — still authenticated");
        // 200: session still valid — nothing to do. (currentUser itself
        // isn't held in client state anywhere in this app; the server
        // components re-fetch it on navigation, so there's nothing to
        // update here beyond confirming the session is still good.)
      } catch (err) {
        if (cancelled) {
          console.log("[AUTH POLL] error received after unmount — ignoring");
          return;
        }
        const status = err instanceof ApiError ? err.status : "unknown";
        console.log("[AUTH POLL] response error, status:", status, err);
        if (err instanceof ApiError && err.status === 401) {
          console.log("[AUTH POLL] 401 — clearing session and redirecting to /login");
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          await clearSessionAction();
          console.log("[AUTH POLL] session cookies cleared");
          if (!cancelled) {
            // A full browser navigation (not router.replace()) on purpose:
            // this guarantees the /login request the browser makes carries
            // whatever cookie state the browser actually has at that exact
            // moment, and that proxy.ts's middleware evaluates it fresh —
            // no dependency on Next.js's client-side Router Cache having
            // picked up the Server Action's cookie deletion in time.
            console.log("[AUTH POLL] navigating to /login (full reload)");
            window.location.href = "/login";
          }
        }
        // Non-401 errors (e.g. a transient network blip) are ignored here —
        // the backend's /auth/me response is authoritative only when it
        // actually answers; a failed request isn't evidence the account is
        // gone, and retrying next interval is the correct behavior.
      }
    };

    console.log("[AUTH POLL] START — interval created, will run every", POLL_INTERVAL_MS, "ms");
    intervalRef.current = setInterval(checkAuth, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      console.log("[AUTH POLL] cleanup — clearing interval (unmount or deps changed)");
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [accessToken]);

  return null;
}
