const METRICS = [
  { label: "CPU Usage", value: 34, accent: "emerald" },
  { label: "Memory", value: 58, accent: "cyan" },
  { label: "Queue Depth", value: 12, accent: "violet" },
  { label: "API Latency (p95)", value: 21, suffix: "ms shown as %", accent: "amber", display: "96ms" },
];

const BAR_COLOR: Record<string, string> = {
  emerald: "bg-emerald-400",
  cyan: "bg-cyan-400",
  violet: "bg-violet-400",
  amber: "bg-amber-400",
};

export function SystemHealth() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-100">System Health</h3>
        <span className="flex items-center gap-1.5 text-xs text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Operational
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {METRICS.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{m.label}</span>
              <span className="font-mono text-slate-300">{m.display ?? `${m.value}%`}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full ${BAR_COLOR[m.accent]}`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
        <div>
          <p className="font-mono text-lg font-semibold text-emerald-300">6</p>
          <p className="text-xs text-slate-500">Nodes up</p>
        </div>
        <div>
          <p className="font-mono text-lg font-semibold text-slate-200">0</p>
          <p className="text-xs text-slate-500">Incidents</p>
        </div>
        <div>
          <p className="font-mono text-lg font-semibold text-slate-200">99.98%</p>
          <p className="text-xs text-slate-500">30d uptime</p>
        </div>
      </div>
    </div>
  );
}
