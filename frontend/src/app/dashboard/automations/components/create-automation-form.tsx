"use client";

import { useActionState } from "react";
import { createAutomationAction, type ActionResult } from "@/lib/dashboard/actions";
import type { Workspace } from "@/lib/api/dashboard";

const initialState: ActionResult = { error: null, fieldErrors: {} };

export function CreateAutomationForm({ workspaces }: { workspaces: Workspace[] }) {
  const [state, formAction, pending] = useActionState(createAutomationAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg border border-error/20 bg-error-subtle px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-xs font-medium text-muted">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={150}
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
        />
        {state.fieldErrors?.name && <p className="mt-1 text-xs text-error">{state.fieldErrors.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-medium text-muted">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={1000}
          rows={2}
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
        />
        {state.fieldErrors?.description && (
          <p className="mt-1 text-xs text-error">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="taskGoal" className="block text-xs font-medium text-muted">
          Task goal
        </label>
        <input
          id="taskGoal"
          name="taskGoal"
          type="text"
          required
          maxLength={500}
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
        />
        {state.fieldErrors?.taskGoal && (
          <p className="mt-1 text-xs text-error">{state.fieldErrors.taskGoal[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="workspaceId" className="block text-xs font-medium text-muted">
          Workspace
        </label>
        <select
          id="workspaceId"
          name="workspaceId"
          required
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
        >
          <option value="">Select a workspace</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.workspaceId && (
          <p className="mt-1 text-xs text-error">{state.fieldErrors.workspaceId[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="schedule" className="block text-xs font-medium text-muted">
          Schedule (cron or interval string)
        </label>
        <input
          id="schedule"
          name="schedule"
          type="text"
          required
          placeholder="0 2 * * *"
          maxLength={100}
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
        />
        {state.fieldErrors?.schedule && (
          <p className="mt-1 text-xs text-error">{state.fieldErrors.schedule[0]}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-tertiary">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked
          className="h-4 w-4 rounded border-strong panel-bg"
        />
        Enabled
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-accent/30 bg-accent-subtle px-4 py-2 text-sm font-medium text-accent-hover transition hover:bg-[rgb(59_130_246_/_0.2)] disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create Automation"}
      </button>
    </form>
  );
}
