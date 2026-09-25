import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getLiveSession, getOverviewStats } from "@/lib/api/dashboard";
import { StatsRow } from "../components/stats-row";
import { TerminalPanel } from "../components/terminal-panel";
import { TaskHistoryTable } from "../components/task-history-table";
import { QuickActions } from "../components/quick-actions";
import { LogsPanel } from "../components/logs-panel";
import { WorkspaceOverview } from "../components/workspace-overview";
import { SystemHealth } from "../components/system-health";
import { AiInsights } from "../components/ai-insights";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function OverviewPage() {
  const user = await getCurrentUser();

  let statsError: string | null = null;
  let sessionError: string | null = null;

  const [statsResult, sessionResult] = await Promise.allSettled([
    getOverviewStats(),
    getLiveSession(),
  ]);

  const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
  if (statsResult.status === "rejected") {
    statsError = "Unable to load stats right now.";
  }

  const liveSession = sessionResult.status === "fulfilled" ? sessionResult.value : null;
  if (sessionResult.status === "rejected") {
    sessionError = "Unable to load the live session right now.";
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-faint">
          Here&rsquo;s what your AI terminal agent has been up to.
        </p>
      </div>

      {statsError ? (
        <div className="rounded-2xl border border-error/20 bg-error-subtle p-5 text-sm text-error">
          {statsError}
        </div>
      ) : stats ? (
        <StatsRow stats={stats} />
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-[420px]">
            {sessionError ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-error/20 bg-error-subtle p-5 text-sm text-error">
                {sessionError}
              </div>
            ) : (
              <TerminalPanel session={liveSession} />
            )}
          </div>
        </div>
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TaskHistoryTable />
        </div>
        <SystemHealth />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <WorkspaceOverview />
        <LogsPanel />
        <AiInsights />
      </div>
    </>
  );
}
