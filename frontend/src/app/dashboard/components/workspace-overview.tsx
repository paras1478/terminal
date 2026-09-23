const WORKSPACES = [
  { name: "termina-frontend", branch: "main", lang: "TypeScript", status: "clean", commits: 128 },
  { name: "termina-backend", branch: "feature/redis-cache", lang: "TypeScript", status: "3 changes", commits: 214 },
  { name: "infra-scripts", branch: "main", lang: "Shell", status: "clean", commits: 42 },
];

export function WorkspaceOverview() {
  return (
    <div className="rounded-2xl border border-default panel-bg p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">Workspace Overview</h3>
        <span className="text-xs text-faint">3 connected repos</span>
      </div>
      <div className="mt-4 space-y-3">
        {WORKSPACES.map((w) => (
          <div
            key={w.name}
            className="flex items-center justify-between rounded-xl border border-default panel-bg-soft p-3.5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-default bg-white/5 font-mono text-xs text-tertiary">
                {w.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-secondary">{w.name}</p>
                <p className="font-mono text-xs text-faint">
                  {w.branch} · {w.lang}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                w.status === "clean"
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-300"
              }`}
            >
              {w.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
