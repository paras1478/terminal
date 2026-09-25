"use client";

import { useActionState } from "react";
import { createTaskAction, type ActionResult } from "@/lib/dashboard/actions";
import type { Workspace } from "@/lib/api/dashboard";

const initialState: ActionResult = { error: null, fieldErrors: {} };

export function CreateTaskForm({ workspaces }: { workspaces: Workspace[] }) {
  const [state, formAction, pending] = useActionState(createTaskAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg border border-error/20 bg-error-subtle px-3 py-2 text-sm text-error">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="goal" className="block text-xs font-medium text-muted">
          Goal
        </label>
        <input
          id="goal"
          name="goal"
          type="text"
          required
          maxLength={200}
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
        />
        {state.fieldErrors?.goal && (
          <p className="mt-1 text-xs text-error">{state.fieldErrors.goal[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-medium text-muted">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={2000}
          rows={3}
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
        />
        {state.fieldErrors?.description && (
          <p className="mt-1 text-xs text-error">{state.fieldErrors.description[0]}</p>
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="priority" className="block text-xs font-medium text-muted">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="MEDIUM"
            className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label htmlFor="schedule" className="block text-xs font-medium text-muted">
            Schedule (optional)
          </label>
          <input
            id="schedule"
            name="schedule"
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
          />
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="block text-xs font-medium text-muted">
          Tags (comma separated, optional)
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          placeholder="bug-fix, auth"
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-accent/30 bg-accent-subtle px-4 py-2 text-sm font-medium text-accent-hover transition hover:bg-[rgb(59_130_246_/_0.2)] disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create Task"}
      </button>
    </form>
  );
}
