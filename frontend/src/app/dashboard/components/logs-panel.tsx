type Level = "info" | "warn" | "error" | "success";

const LOGS: { level: Level; message: string; time: string }[] = [
  { level: "success", message: "Deployment to staging completed successfully", time: "09:41:02" },
  { level: "info", message: "New session started by pankaj78@gmail.com", time: "09:38:47" },
  { level: "warn", message: "Rate limit at 82% for /events endpoint", time: "09:35:19" },
  { level: "error", message: "Deploy job TSK-4817 failed: staging health check timeout", time: "09:20:55" },
  { level: "info", message: "Redis cache layer connected (ioredis@5.4)", time: "09:12:03" },
  { level: "success", message: "12 tests passed in auth.test.ts after patch", time: "08:58:41" },
];

const LEVEL_STYLES: Record<Level, string> = {
  info: "bg-cyan-400",
  warn: "bg-amber-400",
  error: "bg-red-400",
  success: "bg-emerald-400",
};

export function LogsPanel() {
  return (
    <div className="rounded-2xl border border-default panel-bg p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary">Recent Logs & Alerts</h3>
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
          1 warning
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {LOGS.map((log, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${LEVEL_STYLES[log.level]}`} />
            <div className="flex-1">
              <p className="text-tertiary">{log.message}</p>
            </div>
            <span className="shrink-0 font-mono text-xs text-faint">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
