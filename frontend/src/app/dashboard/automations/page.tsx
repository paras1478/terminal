import type { Metadata } from "next";
import { listAutomations, listWorkspaces, type LastRunStatus } from "@/lib/api/dashboard";
import { AutomationToggle } from "./components/automation-toggle";
import { CreateAutomationForm } from "./components/create-automation-form";

export const metadata: Metadata = {
  title: "Automations",
};

const LAST_RUN_STYLES: Record<LastRunStatus, string> = {
  SUCCESS: "border-success/30 bg-success-subtle text-success",
  FAILED: "border-error/30 bg-error-subtle text-error",
  PENDING: "border-warning/30 bg-warning-subtle text-warning",
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
        <h1 className="text-2xl font-bold tracking-tight text-primary">Automations</h1>
        <p className="mt-1 text-sm text-faint">Scheduled agent tasks running on autopilot.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-error/20 bg-error-subtle p-5 text-sm text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {automations.length === 0 && !error && (
            <div className="rounded-2xl border border-default panel-bg p-8 text-center text-sm text-muted">
              No automations yet.
            </div>
          )}
          {automations.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-default panel-bg p-5 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-secondary">{a.name}</p>
                  <p className="mt-1 text-sm text-muted">{a.description}</p>
                  <p className="mt-2 font-mono text-xs text-faint">
                    {a.workspaceName} · {a.schedule}
                  </p>
                </div>
                <AutomationToggle id={a.id} enabled={a.enabled} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-faint">
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

        <div className="rounded-2xl border border-default panel-bg p-5 backdrop-blur-xl">
          <h3 className="font-semibold text-primary">Create Automation</h3>
          <div className="mt-4">
            <CreateAutomationForm workspaces={workspaces} />
          </div>
        </div>
      </div>
    </>
  );
}
