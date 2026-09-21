"use client";

import { useActionState } from "react";
import { updateSettingsAction, type ActionResult } from "@/lib/dashboard/actions";
import type { Settings } from "@/lib/api/dashboard";

const initialState: ActionResult = { error: null, fieldErrors: {} };

const MODEL_OPTIONS = [
  "claude-sonnet-5",
  "claude-opus-5",
  "claude-fable-5",
  "claude-haiku-4-5-20251001",
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);
  const maskedKeys = Object.keys(settings.apiKeys ?? {});

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-slate-100">Command Safety</h2>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="confirmationRequired"
              defaultChecked={settings.confirmationRequired}
              className="h-4 w-4 rounded border-white/20 bg-white/[0.03]"
            />
            Require confirmation before running commands
          </label>

          <div>
            <label htmlFor="allowedPatterns" className="block text-xs font-medium text-slate-400">
              Allowed patterns (one per line)
            </label>
            <textarea
              id="allowedPatterns"
              name="allowedPatterns"
              rows={4}
              defaultValue={settings.allowedPatterns.join("\n")}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-emerald-400/40"
            />
          </div>

          <div>
            <label htmlFor="dangerousBlocklist" className="block text-xs font-medium text-slate-400">
              Dangerous blocklist (one per line)
            </label>
            <textarea
              id="dangerousBlocklist"
              name="dangerousBlocklist"
              rows={4}
              defaultValue={settings.dangerousBlocklist.join("\n")}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-emerald-400/40"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-slate-100">Resource Limits</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="maxStepsPerTask" className="block text-xs font-medium text-slate-400">
              Max steps per task
            </label>
            <input
              id="maxStepsPerTask"
              name="maxStepsPerTask"
              type="number"
              min={1}
              max={200}
              defaultValue={settings.maxStepsPerTask}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
            />
            {state.fieldErrors?.maxStepsPerTask && (
              <p className="mt-1 text-xs text-red-300">{state.fieldErrors.maxStepsPerTask[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="maxRuntimeSeconds" className="block text-xs font-medium text-slate-400">
              Max runtime (seconds)
            </label>
            <input
              id="maxRuntimeSeconds"
              name="maxRuntimeSeconds"
              type="number"
              min={10}
              max={7200}
              defaultValue={settings.maxRuntimeSeconds}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
            />
            {state.fieldErrors?.maxRuntimeSeconds && (
              <p className="mt-1 text-xs text-red-300">{state.fieldErrors.maxRuntimeSeconds[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="maxConcurrentSessions" className="block text-xs font-medium text-slate-400">
              Max concurrent sessions
            </label>
            <input
              id="maxConcurrentSessions"
              name="maxConcurrentSessions"
              type="number"
              min={1}
              max={20}
              defaultValue={settings.maxConcurrentSessions}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
            />
            {state.fieldErrors?.maxConcurrentSessions && (
              <p className="mt-1 text-xs text-red-300">{state.fieldErrors.maxConcurrentSessions[0]}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-slate-100">Notifications</h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="notifyOnCompletion"
              defaultChecked={settings.notifyOnCompletion}
              className="h-4 w-4 rounded border-white/20 bg-white/[0.03]"
            />
            Notify on completion
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="notifyOnFailure"
              defaultChecked={settings.notifyOnFailure}
              className="h-4 w-4 rounded border-white/20 bg-white/[0.03]"
            />
            Notify on failure
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="notifyByEmail"
              defaultChecked={settings.notifyByEmail}
              className="h-4 w-4 rounded border-white/20 bg-white/[0.03]"
            />
            Notify by email
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-slate-100">Appearance & Model</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="theme" className="block text-xs font-medium text-slate-400">
              Theme
            </label>
            <select
              id="theme"
              name="theme"
              defaultValue={settings.theme}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label htmlFor="modelSelection" className="block text-xs font-medium text-slate-400">
              Model
            </label>
            <select
              id="modelSelection"
              name="modelSelection"
              defaultValue={settings.modelSelection}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-semibold text-slate-100">API Keys</h2>
        <div className="mt-4 space-y-3">
          {maskedKeys.length > 0 ? (
            <ul className="space-y-1 text-sm text-slate-400">
              {maskedKeys.map((k) => (
                <li key={k} className="font-mono text-xs">
                  {k}: {String(settings.apiKeys[k])}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No API keys configured.</p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="apiKeyProvider" className="block text-xs font-medium text-slate-400">
                Provider
              </label>
              <input
                id="apiKeyProvider"
                name="apiKeyProvider"
                type="text"
                placeholder="anthropic"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
              />
            </div>
            <div>
              <label htmlFor="apiKeyValue" className="block text-xs font-medium text-slate-400">
                New key value
              </label>
              <input
                id="apiKeyValue"
                name="apiKeyValue"
                type="password"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
              />
            </div>
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
