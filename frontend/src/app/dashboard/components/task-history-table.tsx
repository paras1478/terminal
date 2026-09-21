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
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  running: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  failed: "border-red-400/30 bg-red-400/10 text-red-300",
  queued: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

const STATUS_LABEL: Record<Status, string> = {
  completed: "Completed",
  running: "Running",
  failed: "Failed",
  queued: "Queued",
};

export function TaskHistoryTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h3 className="font-semibold text-slate-100">Task History</h3>
        <a href="#" className="text-xs font-medium text-emerald-300 hover:text-emerald-200">
          View all →
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-medium">Task</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Duration</th>
              <th className="px-5 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {TASKS.map((task) => (
              <tr key={task.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-200">{task.title}</div>
                  <div className="font-mono text-xs text-slate-500">{task.id}</div>
                </td>
                <td className="px-5 py-3.5 text-slate-400">{task.type}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[task.status]}`}
                  >
                    {STATUS_LABEL[task.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-400">{task.duration}</td>
                <td className="px-5 py-3.5 text-slate-500">{task.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
