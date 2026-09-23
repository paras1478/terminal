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
        <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-300">
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
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
        />
        {state.fieldErrors?.goal && (
          <p className="mt-1 text-xs text-red-300">{state.fieldErrors.goal[0]}</p>
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
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
        />
        {state.fieldErrors?.description && (
          <p className="mt-1 text-xs text-red-300">{state.fieldErrors.description[0]}</p>
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
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
        >
          <option value="">Select a workspace</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.workspaceId && (
          <p className="mt-1 text-xs text-red-300">{state.fieldErrors.workspaceId[0]}</p>
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
            className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
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
            className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
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
          className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create Task"}
      </button>
    </form>
  );
}
