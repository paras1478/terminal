"use client";

import { useEffect, useState } from "react";

export interface LoadingStep {
  id: string;
  label: string;
}

export type StepStatus = "pending" | "active" | "done" | "error";

interface TerminalLoadingScreenProps {
  title?: string;
  steps: LoadingStep[];
  /** Index of the step currently running (or that failed, if status is "error"). */
  activeIndex: number;
  status: "running" | "done" | "error";
  /** Shown under the steps when status is "error". */
  errorMessage?: string;
  onRetry?: () => void;
}

/**
 * Full-screen terminal/IDE-style startup UI. The single shared loading
 * surface for this app (per the "don't create duplicate loading systems"
 * requirement) — currently used by app/auth/loading/page.tsx for the
 * post-OAuth readiness wait, and reusable anywhere else a multi-step
 * startup/readiness sequence needs a visible, professional loading state
 * instead of a bare spinner.
 *
 * Purely presentational: the caller owns all state (which step is active,
 * whether it's done/errored) and passes it in as props — this component
 * only renders it, so it never has its own competing notion of "ready."
 */
export function TerminalLoadingScreen({
  title = "AI TERMINAL",
  steps,
  activeIndex,
  status,
  errorMessage,
  onRetry,
}: TerminalLoadingScreenProps) {
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = () => setReduceMotion(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const progressPct =
    status === "done"
      ? 100
      : Math.round(((activeIndex + (status === "error" ? 0 : 0.5)) / steps.length) * 100);

  return (
    <div className="app-shell-bg fixed inset-0 z-[200] flex items-center justify-center overflow-hidden text-primary">
      {/* Subtle code/editor background texture — same grid used on the dashboard shell */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(59,130,246,0.10),transparent_45%),radial-gradient(circle_at_90%_0%,rgba(167,139,250,0.12),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <div className="w-full max-w-md px-4 sm:max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-default surface-bg shadow-2xl">
          <div className="flex items-center gap-2 border-b border-default px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            <span className="ml-2 font-mono text-xs tracking-widest text-faint">{title}</span>
          </div>

          <div className="space-y-2 p-5 font-mono text-sm leading-relaxed">
            {steps.map((step, i) => {
              const isDone = status === "done" || i < activeIndex;
              const isActive = status !== "done" && i === activeIndex;
              const isError = status === "error" && i === activeIndex;
              const isPending = !isDone && !isActive;

              if (isPending) return null;

              return (
                <div
                  key={step.id}
                  className={`flex items-center justify-between gap-3 ${
                    reduceMotion ? "" : "animate-[terminal-line-in_0.25s_ease-out]"
                  }`}
                >
                  <span className={isError ? "text-error" : "text-secondary"}>
                    <span className="text-accent-hover">{">"}</span> {step.label}
                    {isActive && !reduceMotion && (
                      <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-[terminal-cursor-blink_1s_step-end_infinite] bg-accent-hover align-middle" />
                    )}
                  </span>
                  {isDone && !isError && <span className="text-success">✓</span>}
                  {isError && <span className="text-error">✕</span>}
                </div>
              );
            })}

            <div className="pt-2">
              <div className="h-2 overflow-hidden rounded-full border border-subtle panel-bg-soft">
                <div
                  className={`h-full rounded-full ${
                    status === "error"
                      ? "bg-error/70"
                      : "bg-accent-hover"
                  } ${reduceMotion ? "" : "transition-[width] duration-300 ease-out"}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs text-faint">{progressPct}%</p>
            </div>

            {status === "error" && (
              <div className="mt-3 space-y-3 border-t border-subtle pt-3">
                <p className="text-xs text-error">{errorMessage ?? "Something went wrong."}</p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="w-full rounded-lg border border-accent/30 bg-accent-subtle px-4 py-2 text-xs font-medium text-accent-hover transition hover:bg-[rgb(59_130_246_/_0.2)]"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {status === "done" && <p className="pt-1 text-success">Ready.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
