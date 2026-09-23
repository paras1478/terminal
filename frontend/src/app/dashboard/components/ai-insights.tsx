const INSIGHTS = [
  {
    title: "Flaky test detected",
    desc: "auth.test.ts failed intermittently 3 times this week. Consider isolating the JWT clock mock.",
    action: "Investigate",
  },
  {
    title: "Dependency update available",
    desc: "ioredis@5.4 → 5.6 patches a reconnect bug you hit on Aug 2.",
    action: "Review diff",
  },
  {
    title: "Repeated command pattern",
    desc: "You've run \"deploy to staging\" 5 times today. Want to automate this into a one-click action?",
    action: "Create automation",
  },
];

export function AiInsights() {
  return (
    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.07] via-white/[0.02] to-transparent p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-400/10 text-violet-300">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M12 3v4M12 17v4M4 12h4M16 12h4M6 6l3 3M18 6l-3 3M6 18l3-3M18 18l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="font-semibold text-primary">AI Assistant Insights</h3>
      </div>
      <div className="mt-4 space-y-3">
        {INSIGHTS.map((insight) => (
          <div key={insight.title} className="rounded-xl border border-default panel-bg-soft p-3.5">
            <p className="text-sm font-medium text-secondary">{insight.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{insight.desc}</p>
            <button
              type="button"
              className="mt-2 text-xs font-medium text-violet-300 hover:text-violet-200"
            >
              {insight.action} →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
