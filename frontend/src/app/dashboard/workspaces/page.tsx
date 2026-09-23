import type { Metadata } from "next";
import Link from "next/link";
import { listWorkspaces } from "@/lib/api/dashboard";

export const metadata: Metadata = {
  title: "Workspaces",
};

export default async function WorkspacesPage() {
  let error: string | null = null;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];

  try {
    workspaces = await listWorkspaces();
  } catch {
    error = "Unable to load workspaces right now.";
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Workspaces</h1>
        <p className="mt-1 text-sm text-faint">Connected repositories and projects.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {workspaces.length === 0 && !error && (
        <div className="rounded-2xl border border-default panel-bg p-8 text-center text-sm text-muted">
          No workspaces yet.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((w) => (
          <Link
            key={w.id}
            href={`/dashboard/workspaces/${w.id}`}
            className="rounded-2xl border border-default panel-bg p-5 backdrop-blur-xl transition hover:border-strong"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-default bg-white/5 font-mono text-xs text-tertiary">
                {w.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-secondary">{w.name}</p>
                <p className="font-mono text-xs text-faint">{w.languageStack}</p>
              </div>
            </div>
            <p className="mt-3 truncate text-xs text-faint">{w.pathOrRepoUrl}</p>
            <p className="mt-1 text-xs text-muted">{w.recentActivity}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-faint">
              <span>{w.sessionsCount} sessions</span>
              <span>{w.tasksCount} tasks</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
