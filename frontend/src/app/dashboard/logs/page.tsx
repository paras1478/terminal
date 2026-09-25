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
        <h1 className="text-2xl font-bold tracking-tight text-primary">Logs</h1>
        <p className="mt-1 text-sm text-faint">Command and output history across all sessions.</p>
      </div>

      <form
        method="get"
        className="grid grid-cols-1 gap-3 rounded-2xl border border-default panel-bg p-4 sm:grid-cols-5"
      >
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search commands…"
          className="rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover sm:col-span-2"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
        >
          <option value="">Any status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <select
          name="workspaceId"
          defaultValue={params.workspaceId ?? ""}
          className="rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
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
          className="rounded-lg border border-accent/30 bg-accent-subtle px-3 py-2 text-sm font-medium text-accent-hover hover:bg-[rgb(59_130_246_/_0.2)]"
        >
          Filter
        </button>
        <input
          type="datetime-local"
          name="from"
          defaultValue={params.from ?? ""}
          className="rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover sm:col-span-2"
        />
        <input
          type="datetime-local"
          name="to"
          defaultValue={params.to ?? ""}
          className="rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover sm:col-span-2"
        />
      </form>

      {error && (
        <div className="rounded-2xl border border-error/20 bg-error-subtle p-5 text-sm text-error">
          {error}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-2xl border border-default panel-bg p-8 text-center text-sm text-muted">
          No logs match these filters.
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-default panel-bg backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-default text-xs uppercase tracking-wide text-faint">
                  <th className="px-5 py-3 font-medium">Command</th>
                  <th className="px-5 py-3 font-medium">Workspace</th>
                  <th className="px-5 py-3 font-medium">Exit</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log) => (
                  <tr key={log.id} className="border-b border-subtle transition hover:panel-bg">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/logs/${log.id}`}
                        className="block font-mono text-secondary hover:text-accent-hover"
                      >
                        {log.command}
                      </Link>
                      <div className="mt-0.5 max-w-md truncate text-xs text-faint">
                        {log.outputPreview}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{log.workspaceName}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                          log.exitStatus === 0
                            ? "border-success/30 bg-success-subtle text-success"
                            : "border-error/30 bg-error-subtle text-error"
                        }`}
                      >
                        {log.exitStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-faint">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-default px-5 py-3 text-xs text-faint">
            <span>
              Page {data.page} · {data.total} total
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={{ pathname: "/dashboard/logs", query: { ...params, page: page - 1 } }}
                  className="rounded-lg border border-default px-3 py-1.5 text-tertiary hover:border-strong"
                >
                  Previous
                </Link>
              )}
              {page * data.pageSize < data.total && (
                <Link
                  href={{ pathname: "/dashboard/logs", query: { ...params, page: page + 1 } }}
                  className="rounded-lg border border-default px-3 py-1.5 text-tertiary hover:border-strong"
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
