import type { Metadata } from "next";
import Link from "next/link";
import { listSessions, type SessionStatus } from "@/lib/api/dashboard";
import { NewSessionButton } from "./components/new-session-button";
import { SessionsTable } from "./components/sessions-table";

export const metadata: Metadata = {
  title: "Sessions",
};

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; workspaceId?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  let error: string | null = null;
  let data: Awaited<ReturnType<typeof listSessions>> | null = null;

  try {
    data = await listSessions({
      page,
      pageSize: 20,
      status: params.status as SessionStatus | undefined,
      workspaceId: params.workspaceId,
    });
  } catch {
    error = "Unable to load sessions right now.";
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Sessions</h1>
          <p className="mt-1 text-sm text-slate-500">
            All agent sessions, running and completed.
          </p>
        </div>
        <div className="shrink-0">
          <NewSessionButton />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && (
        <>
          <SessionsTable initialItems={data.items} />
          {data.items.length > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-xs text-slate-500">
              <span>
                Page {data.page} · {data.total} total
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/dashboard/sessions?page=${page - 1}`}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 hover:border-white/20"
                  >
                    Previous
                  </Link>
                )}
                {page * data.pageSize < data.total && (
                  <Link
                    href={`/dashboard/sessions?page=${page + 1}`}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-slate-300 hover:border-white/20"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
