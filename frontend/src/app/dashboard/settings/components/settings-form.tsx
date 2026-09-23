"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { updateSettingsAction, type ActionResult } from "@/lib/dashboard/actions";
import type { Settings } from "@/lib/api/dashboard";
import { deleteApiKeyClient, validateApiKeyClient } from "@/lib/api/settings-client";
import { useTheme, type ThemePreference } from "@/components/theme/theme-provider";
import { useToast } from "@/components/toast/toast-provider";

const initialState: ActionResult = { error: null, fieldErrors: {} };

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google Gemini",
};

export function SettingsForm({
  settings,
  accessToken,
}: {
  settings: Settings;
  accessToken: string;
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [maskedKeys, setMaskedKeys] = useState<Record<string, string>>(
    settings.apiKeys as Record<string, string>,
  );
  const [apiKeyProvider, setApiKeyProvider] = useState("openai");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [validation, setValidation] = useState<{ status: "idle" | "checking" | "valid" | "invalid"; message?: string }>({
    status: "idle",
  });
  const [, startDeleteTransition] = useTransition();
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);

  const wasPending = useRef(pending);
  useEffect(() => {
    if (wasPending.current && !pending) {
      if (state.error) {
        showToast(state.error, "error");
      } else if (!state.fieldErrors || Object.keys(state.fieldErrors).length === 0) {
        showToast("Settings saved.", "success");
      }
    }
    wasPending.current = pending;
  }, [pending, state, showToast]);

  async function handleValidateKey() {
    if (!apiKeyValue.trim()) return;
    setValidation({ status: "checking" });
    try {
      const result = await validateApiKeyClient(accessToken, apiKeyProvider, apiKeyValue.trim());
      setValidation({
        status: result.valid ? "valid" : "invalid",
        message: result.message,
      });
    } catch {
      setValidation({ status: "invalid", message: "Could not reach the server to validate this key." });
    }
  }

  function handleDeleteKey(provider: string) {
    setDeletingProvider(provider);
    startDeleteTransition(async () => {
      try {
        const updated = await deleteApiKeyClient(accessToken, provider);
        setMaskedKeys(updated.apiKeys as Record<string, string>);
        showToast(`Removed ${PROVIDER_LABELS[provider] ?? provider} API key.`, "success");
      } catch {
        showToast(`Failed to remove the ${PROVIDER_LABELS[provider] ?? provider} API key.`, "error");
      } finally {
        setDeletingProvider(null);
      }
    });
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      {state.error && (
        <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <section className="rounded-2xl border border-default panel-bg p-5">
        <h2 className="font-semibold text-primary">Command Safety</h2>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm text-tertiary">
            <input
              type="checkbox"
              name="confirmationRequired"
              defaultChecked={settings.confirmationRequired}
              className="h-4 w-4 rounded border-strong panel-bg"
            />
            Require confirmation before running commands
          </label>

          <div>
            <label htmlFor="allowedPatterns" className="block text-xs font-medium text-muted">
              Allowed patterns (one per line)
            </label>
            <textarea
              id="allowedPatterns"
              name="allowedPatterns"
              rows={4}
              defaultValue={settings.allowedPatterns.join("\n")}
              className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 font-mono text-sm text-secondary outline-none focus:border-emerald-400/40"
            />
          </div>

          <div>
            <label htmlFor="dangerousBlocklist" className="block text-xs font-medium text-muted">
              Dangerous blocklist (one per line)
            </label>
            <textarea
              id="dangerousBlocklist"
              name="dangerousBlocklist"
              rows={4}
              defaultValue={settings.dangerousBlocklist.join("\n")}
              className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 font-mono text-sm text-secondary outline-none focus:border-emerald-400/40"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-default panel-bg p-5">
        <h2 className="font-semibold text-primary">Resource Limits</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="maxStepsPerTask" className="block text-xs font-medium text-muted">
              Max steps per task
            </label>
            <input
              id="maxStepsPerTask"
              name="maxStepsPerTask"
              type="number"
              min={1}
              max={200}
              defaultValue={settings.maxStepsPerTask}
              className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
            />
            {state.fieldErrors?.maxStepsPerTask && (
              <p className="mt-1 text-xs text-red-300">{state.fieldErrors.maxStepsPerTask[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="maxRuntimeSeconds" className="block text-xs font-medium text-muted">
              Max runtime (seconds)
            </label>
            <input
              id="maxRuntimeSeconds"
              name="maxRuntimeSeconds"
              type="number"
              min={10}
              max={7200}
              defaultValue={settings.maxRuntimeSeconds}
              className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
            />
            {state.fieldErrors?.maxRuntimeSeconds && (
              <p className="mt-1 text-xs text-red-300">{state.fieldErrors.maxRuntimeSeconds[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="maxConcurrentSessions" className="block text-xs font-medium text-muted">
              Max concurrent sessions
            </label>
            <input
              id="maxConcurrentSessions"
              name="maxConcurrentSessions"
              type="number"
              min={1}
              max={20}
              defaultValue={settings.maxConcurrentSessions}
              className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
            />
            {state.fieldErrors?.maxConcurrentSessions && (
              <p className="mt-1 text-xs text-red-300">{state.fieldErrors.maxConcurrentSessions[0]}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-default panel-bg p-5">
        <h2 className="font-semibold text-primary">Notifications</h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-tertiary">
            <input
              type="checkbox"
              name="notifyOnCompletion"
              defaultChecked={settings.notifyOnCompletion}
              className="h-4 w-4 rounded border-strong panel-bg"
            />
            Notify on completion
          </label>
          <label className="flex items-center gap-2 text-sm text-tertiary">
            <input
              type="checkbox"
              name="notifyOnFailure"
              defaultChecked={settings.notifyOnFailure}
              className="h-4 w-4 rounded border-strong panel-bg"
            />
            Notify on failure
          </label>
          <label className="flex items-center gap-2 text-sm text-tertiary">
            <input
              type="checkbox"
              name="notifyByEmail"
              defaultChecked={settings.notifyByEmail}
              className="h-4 w-4 rounded border-strong panel-bg"
            />
            Notify by email
          </label>
          <p className="text-xs text-faint">
            Completion/failure notifications fire when a session finishes. Email requires the
            server to have SMTP configured — if it isn&apos;t, the app will fall back to in-app
            notifications only.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-default panel-bg p-5">
        <h2 className="font-semibold text-primary">Appearance & Model</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="theme" className="block text-xs font-medium text-muted">
              Theme
            </label>
            <select
              id="theme"
              name="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemePreference)}
              className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
            <p className="mt-1 text-xs text-faint">Applies immediately across the whole app.</p>
          </div>
          <div>
            <label htmlFor="modelSelection" className="block text-xs font-medium text-muted">
              Model
            </label>
            <select
              id="modelSelection"
              name="modelSelection"
              defaultValue={settings.modelSelection}
              className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
            >
              {settings.availableModels.map((m) => (
                <option key={m.id} value={m.id} disabled={!m.available}>
                  {m.label} ({PROVIDER_LABELS[m.provider] ?? m.provider})
                  {!m.available ? " — no API key configured" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-faint">
              Models without a configured API key are disabled below until you add one.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-default panel-bg p-5">
        <h2 className="font-semibold text-primary">API Keys</h2>
        <div className="mt-4 space-y-3">
          {Object.keys(maskedKeys ?? {}).length > 0 ? (
            <ul className="space-y-2 text-sm text-muted">
              {Object.entries(maskedKeys).map(([provider, masked]) => (
                <li key={provider} className="flex items-center justify-between gap-3 rounded-lg border border-subtle panel-bg-soft px-3 py-2">
                  <span className="font-mono text-xs">
                    {PROVIDER_LABELS[provider] ?? provider}: {String(masked)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteKey(provider)}
                    disabled={deletingProvider === provider}
                    className="text-xs font-medium text-red-300 hover:text-red-200 disabled:opacity-50"
                  >
                    {deletingProvider === provider ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-faint">No API keys configured.</p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="apiKeyProvider" className="block text-xs font-medium text-muted">
                Provider
              </label>
              <select
                id="apiKeyProvider"
                name="apiKeyProvider"
                value={apiKeyProvider}
                onChange={(e) => {
                  setApiKeyProvider(e.target.value);
                  setValidation({ status: "idle" });
                }}
                className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google Gemini</option>
              </select>
            </div>
            <div>
              <label htmlFor="apiKeyValue" className="block text-xs font-medium text-muted">
                New key value
              </label>
              <input
                id="apiKeyValue"
                name="apiKeyValue"
                type="password"
                autoComplete="off"
                value={apiKeyValue}
                onChange={(e) => {
                  setApiKeyValue(e.target.value);
                  setValidation({ status: "idle" });
                }}
                className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-emerald-400/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleValidateKey}
              disabled={!apiKeyValue.trim() || validation.status === "checking"}
              className="rounded-lg border border-default panel-bg px-3 py-1.5 text-xs font-medium text-secondary transition panel-bg-hover disabled:opacity-50"
            >
              {validation.status === "checking" ? "Checking…" : "Validate key"}
            </button>
            {validation.status === "valid" && (
              <span className="text-xs text-emerald-300">Key accepted by provider.</span>
            )}
            {validation.status === "invalid" && (
              <span className="text-xs text-red-300">{validation.message ?? "Key rejected."}</span>
            )}
          </div>
          <p className="text-xs text-faint">
            Keys are saved when you click &quot;Save Settings&quot; below. Stored keys are never
            shown in full again — only the last 4 characters are displayed once saved.
          </p>
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
