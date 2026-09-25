import Link from "next/link";
import type { LiveSession } from "@/lib/api/dashboard";

function StepLine({ step }: { step: LiveSession["steps"][number] }) {
  if (step.type === "COMMAND" || step.type === "command") {
    return (
      <div className="flex gap-2 text-secondary">
        <span className="text-accent-hover">$</span>
        <span>{step.command ?? "(no command)"}</span>
      </div>
    );
  }

  const isError = typeof step.exitStatus === "number" && step.exitStatus !== 0;
  return (
    <div className={`pl-4 ${isError ? "text-error" : "text-faint"}`}>
      {step.output ?? step.type}
    </div>
  );
}

export function TerminalPanel({ session }: { session: LiveSession | null }) {
  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-default surface-bg/90 p-8 text-center backdrop-blur-xl">
        <p className="font-mono text-xs text-faint">agent-session · idle</p>
        <p className="text-sm text-muted">No agent session is currently running.</p>
        <Link
          href="/dashboard/sessions"
          className="mt-2 text-xs font-medium text-accent-hover hover:text-accent"
        >
          View past sessions →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-default surface-bg/90 backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-default panel-bg px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-error/70" />
        <span className="h-3 w-3 rounded-full bg-warning/70" />
        <span className="h-3 w-3 rounded-full bg-success/70" />
        <span className="ml-3 truncate font-mono text-xs text-faint">
          {session.workspaceName} · {session.goal}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-success">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          {session.status.toLowerCase()}
        </span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-5 font-mono text-[13px] leading-relaxed">
        {session.plan.length > 0 && (
          <div className="mb-3 space-y-1 border-b border-default pb-3">
            {session.plan.map((step) => (
              <div
                key={step.order}
                className={`flex items-center gap-2 ${step.done ? "text-success" : "text-faint"}`}
              >
                <span>{step.done ? "✓" : "○"}</span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        )}
        {session.steps.map((step, i) => (
          <div key={`${step.order}-${i}`}>
            <StepLine step={step} />
          </div>
        ))}
        <span className="inline-block h-3.5 w-2 animate-pulse bg-accent-hover align-middle" />
      </div>
      <div className="border-t border-default px-4 py-2 text-right">
        <Link
          href={`/dashboard/sessions/${session.id}`}
          className="text-xs font-medium text-accent-hover hover:text-accent"
        >
          Open full session →
        </Link>
      </div>
    </div>
  );
}
