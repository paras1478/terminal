import type { Metadata } from "next";
import Link from "next/link";
import { ApiError, getWorkspace } from "@/lib/api/dashboard";

export const metadata: Metadata = {
  title: "Workspace detail",
};

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let error: string | null = null;
  let workspace: Awaited<ReturnType<typeof getWorkspace>> | null = null;

  try {
    workspace = await getWorkspace(id);
  } catch (err) {
    error = err instanceof ApiError ? err.message : "Unable to load this workspace.";
  }

  return (
    <>
      <div>
        <Link
          href="/dashboard/workspaces"
          className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
        >
          ← Back to workspaces
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {workspace && (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">{workspace.name}</h1>
            <p className="mt-1 font-mono text-sm text-slate-500">{workspace.pathOrRepoUrl}</p>
            <p className="mt-1 text-sm text-slate-400">{workspace.languageStack}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Sessions</p>
              <p className="mt-1 font-mono text-lg text-slate-200">{workspace.sessionsCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Tasks</p>
              <p className="mt-1 font-mono text-lg text-slate-200">{workspace.tasksCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Logs</p>
              <p className="mt-1 font-mono text-lg text-slate-200">{workspace.logsCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Recent activity</p>
              <p className="mt-1 text-sm text-slate-300">{workspace.recentActivity}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold text-slate-100">Integrations</h2>
              <div className="mt-3 space-y-2">
                {workspace.integrations.length === 0 && (
                  <p className="text-sm text-slate-500">None connected.</p>
                )}
                {workspace.integrations.map((i) => (
                  <div key={i.key} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{i.name}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        i.status === "CONNECTED"
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          : "border-slate-400/30 bg-slate-400/10 text-slate-400"
                      }`}
                    >
                      {i.status === "CONNECTED" ? "Connected" : "Not connected"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold text-slate-100">Recent Sessions</h2>
              <div className="mt-3 space-y-2">
                {workspace.recentSessions.length === 0 && (
                  <p className="text-sm text-slate-500">No sessions yet.</p>
                )}
                {workspace.recentSessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/sessions/${s.id}`}
                    className="block rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-sm text-slate-300 hover:border-white/20"
                  >
                    <p className="truncate">{s.goal}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {s.status} · {new Date(s.startedAt).toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-semibold text-slate-100">Recent Tasks</h2>
              <div className="mt-3 space-y-2">
                {workspace.recentTasks.length === 0 && (
                  <p className="text-sm text-slate-500">No tasks yet.</p>
                )}
                {workspace.recentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-sm text-slate-300"
                  >
                    <p className="truncate">{t.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{t.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
