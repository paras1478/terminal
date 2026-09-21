import type { Metadata } from "next";
import { listAutomations, listWorkspaces, type LastRunStatus } from "@/lib/api/dashboard";
import { AutomationToggle } from "./components/automation-toggle";
import { CreateAutomationForm } from "./components/create-automation-form";

export const metadata: Metadata = {
  title: "Automations",
};

const LAST_RUN_STYLES: Record<LastRunStatus, string> = {
  SUCCESS: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  FAILED: "border-red-400/30 bg-red-400/10 text-red-300",
  PENDING: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

export default async function AutomationsPage() {
  let error: string | null = null;
  let automations: Awaited<ReturnType<typeof listAutomations>> = [];
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];

  try {
    [automations, workspaces] = await Promise.all([listAutomations(), listWorkspaces()]);
  } catch {
    error = "Unable to load automations right now.";
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Automations</h1>
        <p className="mt-1 text-sm text-slate-500">Scheduled agent tasks running on autopilot.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {automations.length === 0 && !error && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-400">
              No automations yet.
            </div>
          )}
          {automations.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-200">{a.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{a.description}</p>
                  <p className="mt-2 font-mono text-xs text-slate-500">
                    {a.workspaceName} · {a.schedule}
                  </p>
                </div>
                <AutomationToggle id={a.id} enabled={a.enabled} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>Next run: {new Date(a.nextRunAt).toLocaleString()}</span>
                <span>
                  Last run: {a.lastRunAt ? new Date(a.lastRunAt).toLocaleString() : "never"}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-medium ${LAST_RUN_STYLES[a.lastRunStatus]}`}
                >
                  {a.lastRunStatus}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <h3 className="font-semibold text-slate-100">Create Automation</h3>
          <div className="mt-4">
            <CreateAutomationForm workspaces={workspaces} />
          </div>
        </div>
      </div>
    </>
  );
}
