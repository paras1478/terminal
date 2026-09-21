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
        <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-xs font-medium text-slate-400">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={150}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
        />
        {state.fieldErrors?.name && <p className="mt-1 text-xs text-red-300">{state.fieldErrors.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-medium text-slate-400">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={1000}
          rows={2}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
        />
        {state.fieldErrors?.description && (
          <p className="mt-1 text-xs text-red-300">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="taskGoal" className="block text-xs font-medium text-slate-400">
          Task goal
        </label>
        <input
          id="taskGoal"
          name="taskGoal"
          type="text"
          required
          maxLength={500}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
        />
        {state.fieldErrors?.taskGoal && (
          <p className="mt-1 text-xs text-red-300">{state.fieldErrors.taskGoal[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="workspaceId" className="block text-xs font-medium text-slate-400">
          Workspace
        </label>
        <select
          id="workspaceId"
          name="workspaceId"
          required
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
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

      <div>
        <label htmlFor="schedule" className="block text-xs font-medium text-slate-400">
          Schedule (cron or interval string)
        </label>
        <input
          id="schedule"
          name="schedule"
          type="text"
          required
          placeholder="0 2 * * *"
          maxLength={100}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
        />
        {state.fieldErrors?.schedule && (
          <p className="mt-1 text-xs text-red-300">{state.fieldErrors.schedule[0]}</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked
          className="h-4 w-4 rounded border-white/20 bg-white/[0.03]"
        />
        Enabled
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create Automation"}
      </button>
    </form>
  );
}
