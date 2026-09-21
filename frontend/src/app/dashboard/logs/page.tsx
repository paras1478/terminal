import type { Metadata } from "next";
import Link from "next/link";
import { listLogs, listWorkspaces } from "@/lib/api/dashboard";

export const metadata: Metadata = {
  title: "Logs",
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    workspaceId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  let error: string | null = null;
  let data: Awaited<ReturnType<typeof listLogs>> | null = null;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];

  try {
    [data, workspaces] = await Promise.all([
      listLogs({
        page,
        pageSize: 25,
        q: params.q,
        status: params.status === "success" || params.status === "failed" ? params.status : undefined,
        workspaceId: params.workspaceId,
        from: params.from,
        to: params.to,
      }),
      listWorkspaces(),
    ]);
  } catch {
    error = "Unable to load logs right now.";
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Logs</h1>
        <p className="mt-1 text-sm text-slate-500">Command and output history across all sessions.</p>
      </div>

      <form
        method="get"
        className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-5"
      >
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search commands…"
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40 sm:col-span-2"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
        >
          <option value="">Any status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <select
          name="workspaceId"
          defaultValue={params.workspaceId ?? ""}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
        >
          <option value="">Any workspace</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-400/20"
        >
          Filter
        </button>
        <input
          type="datetime-local"
          name="from"
          defaultValue={params.from ?? ""}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40 sm:col-span-2"
        />
        <input
          type="datetime-local"
          name="to"
          defaultValue={params.to ?? ""}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40 sm:col-span-2"
        />
      </form>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-400">
          No logs match these filters.
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Command</th>
                  <th className="px-5 py-3 font-medium">Workspace</th>
                  <th className="px-5 py-3 font-medium">Exit</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/logs/${log.id}`}
                        className="block font-mono text-slate-200 hover:text-emerald-300"
                      >
                        {log.command}
                      </Link>
                      <div className="mt-0.5 max-w-md truncate text-xs text-slate-500">
                        {log.outputPreview}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{log.workspaceName}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                          log.exitStatus === 0
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : "border-red-400/30 bg-red-400/10 text-red-300"
                        }`}
                      >
                        {log.exitStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-slate-500">
            <span>
              Page {data.page} · {data.total} total
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={{ pathname: "/dashboard/logs", query: { ...params, page: page - 1 } }}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 hover:border-white/20"
                >
                  Previous
                </Link>
              )}
              {page * data.pageSize < data.total && (
                <Link
                  href={{ pathname: "/dashboard/logs", query: { ...params, page: page + 1 } }}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 hover:border-white/20"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
