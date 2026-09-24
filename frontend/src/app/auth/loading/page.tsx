"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TerminalLoadingScreen, type LoadingStep } from "@/components/loading/terminal-loading-screen";
import { API_BASE_URL } from "@/lib/env";

/**
 * Lands here right after app/auth/callback/route.ts has already exchanged
 * the OAuth code and set the session cookies server-side — this page's job
 * is purely to confirm the app is actually ready to serve /dashboard before
 * navigating there for real.
 *
 * Why this exists: the previous flow did an instant server-to-server
 * redirect straight to /dashboard. On Render, if either service had just
 * cold-started (the free tier idles and spins down), that redirect could
 * land before the target was actually ready to accept the connection,
 * surfacing as ERR_CONNECTION_* on the very first request — a manual
 * refresh moments later would then succeed since the service had finished
 * starting up by then. This page closes that race: it polls the backend's
 * root route (GET /api/v1, AppController's existing "Hello World" endpoint)
 * with retry/backoff from the BROWSER, so the browser only navigates to
 * /dashboard once a real request has actually succeeded. Deliberately NOT
 * GET /health — that endpoint also checks MongoDB connectivity (via
 * Terminus), which answers a different question ("is the database healthy")
 * than what this page needs ("is the HTTP server reachable at all"); a slow
 * or degraded DB shouldn't block the user from reaching a working app.
 */
const STEPS: LoadingStep[] = [
  { id: "workspace", label: "Initializing workspace..." },
  { id: "files", label: "Loading project files..." },
  { id: "backend", label: "Connecting to backend..." },
  { id: "auth", label: "Loading authentication..." },
  { id: "engine", label: "Initializing AI engine..." },
  { id: "terminal", label: "Preparing terminal..." },
];

const BACKEND_STEP_INDEX = STEPS.findIndex((s) => s.id === "backend");
const MAX_RETRIES = 6;
const BASE_RETRY_DELAY_MS = 800;
const OVERALL_TIMEOUT_MS = 30_000;

async function pingBackend(signal: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(API_BASE_URL, { signal, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

function AuthLoadingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState<"running" | "done" | "error">("running");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);
  const cancelledRef = useRef(false);

  const run = useCallback(async () => {
    cancelledRef.current = false;
    setStatus("running");
    setErrorMessage(undefined);
    setActiveIndex(0);

    // Quick cosmetic steps before the real readiness check — each is
    // near-instant (no backend call), so this stays fast per the
    // "lightweight and fast" requirement rather than an artificial delay.
    for (let i = 0; i < BACKEND_STEP_INDEX; i++) {
      if (cancelledRef.current) return;
      setActiveIndex(i);
      await new Promise((r) => setTimeout(r, 120));
    }

    setActiveIndex(BACKEND_STEP_INDEX);

    const deadline = Date.now() + OVERALL_TIMEOUT_MS;
    const controller = new AbortController();

    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      if (cancelledRef.current) {
        controller.abort();
        return;
      }
      if (Date.now() > deadline) break;

      const ok = await pingBackend(controller.signal);
      if (ok) {
        for (let i = BACKEND_STEP_INDEX + 1; i < STEPS.length; i++) {
          if (cancelledRef.current) return;
          setActiveIndex(i);
          await new Promise((r) => setTimeout(r, 120));
        }
        if (cancelledRef.current) return;
        setStatus("done");
        setTimeout(() => {
          if (!cancelledRef.current) router.replace(next);
        }, 300);
        return;
      }

      setErrorMessage("Backend is waking up. Retrying...");
      await new Promise((r) => setTimeout(r, BASE_RETRY_DELAY_MS * Math.pow(1.6, retry)));
    }

    if (cancelledRef.current) return;
    setStatus("error");
    setErrorMessage("Couldn't reach the backend in time. It may still be starting up.");
  }, [next, router]);

  useEffect(() => {
    const timeoutId = setTimeout(() => void run(), 0);
    return () => {
      cancelledRef.current = true;
      clearTimeout(timeoutId);
    };
    // Re-runs whenever `attempt` changes (Retry button), including the
    // initial mount at attempt === 0.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const handleRetry = useCallback(() => {
    setAttempt((a) => a + 1);
  }, []);

  return (
    <TerminalLoadingScreen
      steps={STEPS}
      activeIndex={activeIndex}
      status={status}
      errorMessage={errorMessage}
      onRetry={status === "error" ? handleRetry : undefined}
    />
  );
}

export default function AuthLoadingPage() {
  return (
    <Suspense fallback={<TerminalLoadingScreen steps={STEPS} activeIndex={0} status="running" />}>
      <AuthLoadingInner />
    </Suspense>
  );
}
