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
          <h1 className="text-2xl font-bold tracking-tight text-primary">Sessions</h1>
          <p className="mt-1 text-sm text-faint">
            All agent sessions, running and completed.
          </p>
        </div>
        <div className="shrink-0">
          <NewSessionButton />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-error/20 bg-error-subtle p-5 text-sm text-error">
          {error}
        </div>
      )}

      {data && (
        <>
          <SessionsTable initialItems={data.items} />
          {data.items.length > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-default panel-bg px-5 py-3 text-xs text-faint">
              <span>
                Page {data.page} · {data.total} total
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/dashboard/sessions?page=${page - 1}`}
                    className="rounded-lg border border-default px-3 py-1.5 text-tertiary hover:border-strong"
                  >
                    Previous
                  </Link>
                )}
                {page * data.pageSize < data.total && (
                  <Link
                    href={`/dashboard/sessions?page=${page + 1}`}
                    className="rounded-lg border border-default px-3 py-1.5 text-tertiary hover:border-strong"
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
