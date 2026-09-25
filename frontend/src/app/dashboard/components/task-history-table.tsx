type Status = "completed" | "running" | "failed" | "queued";

type Task = {
  id: string;
  title: string;
  type: string;
  status: Status;
  duration: string;
  updated: string;
};

const TASKS: Task[] = [
  { id: "TSK-4821", title: "Fix failing auth test (JWT expiry)", type: "Bug Fix", status: "completed", duration: "1m 42s", updated: "2 min ago" },
  { id: "TSK-4820", title: "Optimize /api/reports N+1 query", type: "Optimization", status: "completed", duration: "3m 08s", updated: "14 min ago" },
  { id: "TSK-4819", title: "Set up Redis cache layer", type: "Automation", status: "running", duration: "0m 51s", updated: "just now" },
  { id: "TSK-4818", title: "Rebase feature/billing onto main", type: "Git", status: "completed", duration: "0m 22s", updated: "38 min ago" },
  { id: "TSK-4817", title: "Deploy staging build v2.4.1", type: "Deployment", status: "failed", duration: "1m 05s", updated: "1 hr ago" },
  { id: "TSK-4816", title: "Install and audit dependencies", type: "Package Mgmt", status: "completed", duration: "0m 47s", updated: "2 hr ago" },
  { id: "TSK-4815", title: "Scaffold new Next.js project", type: "Project Setup", status: "queued", duration: "—", updated: "2 hr ago" },
];

const STATUS_STYLES: Record<Status, string> = {
  completed: "border-success/30 bg-success-subtle text-success",
  running: "border-accent-hover/30 bg-accent-subtle text-accent-hover",
  failed: "border-error/30 bg-error-subtle text-error",
  queued: "border-default panel-bg-strong text-tertiary",
};

const STATUS_LABEL: Record<Status, string> = {
  completed: "Completed",
  running: "Running",
  failed: "Failed",
  queued: "Queued",
};

export function TaskHistoryTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-default panel-bg backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-default px-5 py-4">
        <h3 className="font-semibold text-primary">Task History</h3>
        <a href="#" className="text-xs font-medium text-accent-hover hover:text-accent">
          View all →
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-default text-xs uppercase tracking-wide text-faint">
              <th className="px-5 py-3 font-medium">Task</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Duration</th>
              <th className="px-5 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {TASKS.map((task) => (
              <tr key={task.id} className="border-b border-subtle transition hover:panel-bg">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-secondary">{task.title}</div>
                  <div className="font-mono text-xs text-faint">{task.id}</div>
                </td>
                <td className="px-5 py-3.5 text-muted">{task.type}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[task.status]}`}
                  >
                    {STATUS_LABEL[task.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-muted">{task.duration}</td>
                <td className="px-5 py-3.5 text-faint">{task.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
