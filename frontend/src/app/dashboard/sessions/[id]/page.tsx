import type { Metadata } from "next";
import Link from "next/link";
import { ApiError, getSession, type SessionStatus } from "@/lib/api/dashboard";
import { getAccessToken } from "@/lib/auth/session";
import { SessionTerminal } from "./components/session-terminal";
import { AgentPanel } from "./components/agent-panel";
import { SessionWorkspace } from "./components/session-workspace";

export const metadata: Metadata = {
  title: "Session detail",
};

const STATUS_STYLES: Record<SessionStatus, string> = {
  RUNNING: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  COMPLETED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  FAILED: "border-red-400/30 bg-red-400/10 text-red-300",
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let error: string | null = null;
  let session: Awaited<ReturnType<typeof getSession>> | null = null;

  try {
    session = await getSession(id);
  } catch (err) {
    error = err instanceof ApiError ? err.message : "Unable to load this session.";
  }

  const accessToken = await getAccessToken();

  return (
    <>
      <div>
        <Link href="/dashboard/sessions" className="text-xs font-medium text-emerald-300 hover:text-emerald-200">
          ← Back to sessions
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {session && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">{session.goal}</h1>
              <p className="mt-1 text-sm text-slate-500">{session.workspaceName}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[session.status]}`}
            >
              {session.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Started</p>
              <p className="mt-1 text-sm text-slate-200">
                {new Date(session.startedAt).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Completed</p>
              <p className="mt-1 text-sm text-slate-200">
                {session.completedAt ? new Date(session.completedAt).toLocaleString() : "In progress"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Commands run</p>
              <p className="mt-1 text-sm text-slate-200">{session.commandsCount}</p>
            </div>
          </div>

          {session.plan.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold text-slate-100">Plan</h2>
              <div className="mt-3 space-y-2">
                {session.plan.map((step) => (
                  <div
                    key={step.order}
                    className={`flex items-center gap-2 text-sm ${step.done ? "text-emerald-300" : "text-slate-400"}`}
                  >
                    <span>{step.done ? "✓" : "○"}</span>
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {accessToken && (
            <>
              <SessionWorkspace sessionId={session.id} accessToken={accessToken} />
              <AgentPanel sessionId={session.id} accessToken={accessToken} />
            </>
          )}

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12]/90">
            <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3">
              <h2 className="font-mono text-xs text-slate-500">timeline</h2>
            </div>
            <div className="space-y-1.5 p-5 font-mono text-[13px] leading-relaxed">
              {session.timeline.length === 0 && (
                <p className="text-slate-500">No timeline steps recorded.</p>
              )}
              {session.timeline.map((step, i) => {
                const isCommand = step.type === "COMMAND" || step.type === "command";
                const isError = typeof step.exitStatus === "number" && step.exitStatus !== 0;
                return (
                  <div key={`${step.order}-${i}`}>
                    {isCommand ? (
                      <div className="flex gap-2 text-slate-200">
                        <span className="text-emerald-400">$</span>
                        <span>{step.command}</span>
                      </div>
                    ) : (
                      <div className={`pl-4 ${isError ? "text-red-400" : "text-slate-500"}`}>
                        {step.output ?? step.type}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
