import type { Metadata } from "next";
import Link from "next/link";
import { ApiError, getLog } from "@/lib/api/dashboard";

export const metadata: Metadata = {
  title: "Log detail",
};

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let error: string | null = null;
  let log: Awaited<ReturnType<typeof getLog>> | null = null;

  try {
    log = await getLog(id);
  } catch (err) {
    error = err instanceof ApiError ? err.message : "Unable to load this log entry.";
  }

  return (
    <>
      <div>
        <Link href="/dashboard/logs" className="text-xs font-medium text-emerald-300 hover:text-emerald-200">
          ← Back to logs
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {log && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-mono text-xl font-bold text-primary">{log.command}</h1>
              <p className="mt-1 text-sm text-faint">{log.workspaceName}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                log.exitStatus === 0
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                  : "border-red-400/30 bg-red-400/10 text-red-300"
              }`}
            >
              exit {log.exitStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-default panel-bg p-4">
              <p className="text-xs text-faint">Timestamp</p>
              <p className="mt-1 text-sm text-secondary">{new Date(log.timestamp).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-default panel-bg p-4">
              <p className="text-xs text-faint">Session</p>
              <p className="mt-1 text-sm text-secondary">
                {log.sessionId ? (
                  <Link href={`/dashboard/sessions/${log.sessionId}`} className="text-emerald-300 hover:text-emerald-200">
                    {log.sessionId}
                  </Link>
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-default surface-bg/90">
            <div className="border-b border-default panel-bg px-4 py-3">
              <h2 className="font-mono text-xs text-faint">full output</h2>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap p-5 font-mono text-[13px] leading-relaxed text-tertiary">
              {log.fullOutput}
            </pre>
          </div>
        </>
      )}
    </>
  );
}
