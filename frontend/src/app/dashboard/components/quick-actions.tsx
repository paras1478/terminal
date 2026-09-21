const ACTIONS = [
  { label: "Run Command", desc: "Execute a natural language task", icon: "play", accent: "emerald" },
  { label: "Create Task", desc: "Queue a new automation", icon: "plus", accent: "cyan" },
  { label: "Open Session", desc: "Resume or start a terminal session", icon: "terminal", accent: "violet" },
];

const ACCENTS: Record<string, { text: string; bg: string; ring: string; hover: string }> = {
  emerald: { text: "text-emerald-300", bg: "bg-emerald-400/10", ring: "border-emerald-400/25", hover: "hover:border-emerald-400/50" },
  cyan: { text: "text-cyan-300", bg: "bg-cyan-400/10", ring: "border-cyan-400/25", hover: "hover:border-cyan-400/50" },
  violet: { text: "text-violet-300", bg: "bg-violet-400/10", ring: "border-violet-400/25", hover: "hover:border-violet-400/50" },
};

function ActionIcon({ name }: { name: string }) {
  const cls = "h-5 w-5";
  switch (name) {
    case "play":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M6 4v16l14-8L6 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "terminal":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M4 5h16v14H4V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M7 10l3 2.5L7 15M13 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
      <h3 className="font-semibold text-slate-100">Quick Actions</h3>
      <div className="mt-4 space-y-3">
        {ACTIONS.map((a) => {
          const accent = ACCENTS[a.accent];
          return (
            <button
              key={a.label}
              type="button"
              className={`flex w-full items-center gap-3 rounded-xl border ${accent.ring} bg-white/[0.02] p-3.5 text-left transition ${accent.hover} hover:bg-white/[0.05]`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent.bg} ${accent.text}`}>
                <ActionIcon name={a.icon} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{a.label}</p>
                <p className="text-xs text-slate-500">{a.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
