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
          className="text-xs font-medium text-accent-hover hover:text-accent"
        >
          ← Back to workspaces
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-error/20 bg-error-subtle p-5 text-sm text-error">
          {error}
        </div>
      )}

      {workspace && (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">{workspace.name}</h1>
            <p className="mt-1 font-mono text-sm text-faint">{workspace.pathOrRepoUrl}</p>
            <p className="mt-1 text-sm text-muted">{workspace.languageStack}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-default panel-bg p-4">
              <p className="text-xs text-faint">Sessions</p>
              <p className="mt-1 font-mono text-lg text-secondary">{workspace.sessionsCount}</p>
            </div>
            <div className="rounded-2xl border border-default panel-bg p-4">
              <p className="text-xs text-faint">Tasks</p>
              <p className="mt-1 font-mono text-lg text-secondary">{workspace.tasksCount}</p>
            </div>
            <div className="rounded-2xl border border-default panel-bg p-4">
              <p className="text-xs text-faint">Logs</p>
              <p className="mt-1 font-mono text-lg text-secondary">{workspace.logsCount}</p>
            </div>
            <div className="rounded-2xl border border-default panel-bg p-4">
              <p className="text-xs text-faint">Recent activity</p>
              <p className="mt-1 text-sm text-tertiary">{workspace.recentActivity}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-default panel-bg p-5">
              <h2 className="font-semibold text-primary">Integrations</h2>
              <div className="mt-3 space-y-2">
                {workspace.integrations.length === 0 && (
                  <p className="text-sm text-faint">None connected.</p>
                )}
                {workspace.integrations.map((i) => (
                  <div key={i.key} className="flex items-center justify-between text-sm">
                    <span className="text-tertiary">{i.name}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        i.status === "CONNECTED"
                          ? "border-success/30 bg-success-subtle text-success"
                          : "border-default panel-bg-strong text-muted"
                      }`}
                    >
                      {i.status === "CONNECTED" ? "Connected" : "Not connected"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-default panel-bg p-5">
              <h2 className="font-semibold text-primary">Recent Sessions</h2>
              <div className="mt-3 space-y-2">
                {workspace.recentSessions.length === 0 && (
                  <p className="text-sm text-faint">No sessions yet.</p>
                )}
                {workspace.recentSessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/sessions/${s.id}`}
                    className="block rounded-lg border border-default panel-bg-soft p-2.5 text-sm text-tertiary hover:border-strong"
                  >
                    <p className="truncate">{s.goal}</p>
                    <p className="mt-0.5 text-xs text-faint">
                      {s.status} · {new Date(s.startedAt).toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-default panel-bg p-5">
              <h2 className="font-semibold text-primary">Recent Tasks</h2>
              <div className="mt-3 space-y-2">
                {workspace.recentTasks.length === 0 && (
                  <p className="text-sm text-faint">No tasks yet.</p>
                )}
                {workspace.recentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-default panel-bg-soft p-2.5 text-sm text-tertiary"
                  >
                    <p className="truncate">{t.name}</p>
                    <p className="mt-0.5 text-xs text-faint">{t.status}</p>
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
