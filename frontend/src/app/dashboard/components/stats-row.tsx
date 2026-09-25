import type { OverviewStats } from "@/lib/api/dashboard";

const ACCENTS: Record<string, { text: string; bg: string; ring: string }> = {
  accent: { text: "text-accent-hover", bg: "bg-accent-subtle", ring: "border-accent/25" },
  success: { text: "text-success", bg: "bg-success-subtle", ring: "border-success/25" },
  error: { text: "text-error", bg: "bg-error-subtle", ring: "border-error/25" },
  ai: { text: "text-ai", bg: "bg-ai-subtle", ring: "border-ai/25" },
  warning: { text: "text-warning", bg: "bg-warning-subtle", ring: "border-warning/25" },
};

function StatIcon({ name, className }: { name: string; className?: string }) {
  const cls = className ?? "h-5 w-5";
  switch (name) {
    case "terminal":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M4 5h16v14H4V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M7 10l3 2.5L7 15M13 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "warn":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M12 9v4M12 17h.01M10.3 4.3 2.7 18a1.5 1.5 0 0 0 1.3 2.2h16a1.5 1.5 0 0 0 1.3-2.2L13.7 4.3a1.5 1.5 0 0 0-2.6 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "pulse":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M3 12h4l2 6 4-14 2 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function formatDelta(changePct: number): { label: string; trend: "up" | "down" | "flat" } {
  if (changePct > 0) return { label: `+${changePct}%`, trend: "up" };
  if (changePct < 0) return { label: `${changePct}%`, trend: "down" };
  return { label: "0%", trend: "flat" };
}

export function StatsRow({ stats }: { stats: OverviewStats }) {
  const cards = [
    {
      title: "Total Commands Run",
      value: stats.totalCommands.value.toLocaleString(),
      ...formatDelta(stats.totalCommands.changePct),
      icon: "terminal",
      accent: "accent",
    },
    {
      title: "Successful Tasks",
      value: stats.successfulCommands.value.toLocaleString(),
      ...formatDelta(stats.successfulCommands.changePct),
      icon: "check",
      accent: "success",
    },
    {
      title: "Failed Tasks",
      value: stats.failedCommands.value.toLocaleString(),
      ...formatDelta(stats.failedCommands.changePct),
      icon: "warn",
      accent: "error",
    },
    {
      title: "Active Sessions",
      value: stats.activeSessions.value.toLocaleString(),
      ...formatDelta(stats.activeSessions.changePct),
      icon: "pulse",
      accent: "ai",
    },
    {
      title: "Uptime",
      value: `${stats.uptimePct}%`,
      label: "30d",
      trend: "flat" as const,
      icon: "clock",
      accent: "warning",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((s) => {
        const accent = ACCENTS[s.accent];
        return (
          <div
            key={s.title}
            className="rounded-2xl border border-default panel-bg p-5 backdrop-blur-xl transition hover:border-strong"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${accent.ring} ${accent.bg} ${accent.text}`}>
                <StatIcon name={s.icon} className="h-4.5 w-4.5" />
              </div>
              <span
                className={`text-xs font-medium ${
                  s.trend === "up" ? "text-success" : s.trend === "down" ? "text-error" : "text-faint"
                }`}
              >
                {s.label}
              </span>
            </div>
            <p className="mt-4 font-mono text-2xl font-bold text-primary">{s.value}</p>
            <p className="mt-1 text-xs text-faint">{s.title}</p>
          </div>
        );
      })}
    </div>
  );
}
