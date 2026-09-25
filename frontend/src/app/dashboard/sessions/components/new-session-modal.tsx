"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createSessionAction, type ActionResult } from "@/lib/dashboard/actions";

const initialState: ActionResult = { error: null, fieldErrors: {} };

export function NewSessionModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createSessionAction, initialState);
  const [selectedPath, setSelectedPath] = useState("");
  const [isElectron, setIsElectron] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

  useEffect(() => {
    setIsElectron(typeof window !== "undefined" && window.desktopBridge?.isElectron === true);
  }, []);

  useEffect(() => {
    if (state.success && state.sessionId) {
      onClose();
      router.push(`/dashboard/sessions/${state.sessionId}`);
    }
  }, [state.success, state.sessionId, onClose, router]);

  async function handleSelectFolder() {
    setFolderError(null);
    try {
      const folder = await window.desktopBridge?.selectFolder();
      if (folder) {
        setSelectedPath(folder);
      }
    } catch {
      setFolderError("Unable to open the folder picker. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(7_11_20_/_0.7)] p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-session-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-default surface-bg shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-default px-6 py-4">
          <h2 id="new-session-title" className="text-lg font-semibold text-primary">
            New Session
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-faint transition hover:text-tertiary"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form action={formAction} className="space-y-4 px-6 py-5">
          {state.error && (
            <p
              role="alert"
              className="rounded-lg border border-error/20 bg-error-subtle px-3 py-2 text-sm text-error"
            >
              {state.error}
            </p>
          )}

          <div>
            <label htmlFor="path" className="block text-xs font-medium text-muted">
              Project location
            </label>

            <div className="mt-1 flex gap-2">
              <input
                id="path"
                name="path"
                type="text"
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                placeholder="C:\Users\you\projects\my-app"
                className="w-full rounded-lg border border-default panel-bg px-3 py-2 font-mono text-sm text-secondary outline-none focus:border-accent-hover"
              />
              {isElectron && (
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="shrink-0 rounded-lg border border-default panel-bg px-3 py-2 text-sm font-medium text-secondary transition hover:border-accent-hover hover:panel-bg-strong"
                >
                  Browse…
                </button>
              )}
            </div>

            <p className="mt-1 text-xs text-faint">
              Enter the absolute path to a project folder already on this machine.
            </p>

            {folderError && <p className="mt-1 text-xs text-error">{folderError}</p>}

            {state.fieldErrors?.path && (
              <p className="mt-1 text-xs text-error">{state.fieldErrors.path[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-medium text-muted">
              Workspace name (optional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              maxLength={200}
              placeholder="my-app"
              className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
            />
          </div>

          <div>
            <label htmlFor="goal" className="block text-xs font-medium text-muted">
              Goal
            </label>
            <textarea
              id="goal"
              name="goal"
              required
              maxLength={500}
              rows={3}
              placeholder="Fix the failing checkout tests"
              className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
            />
            {state.fieldErrors?.goal && (
              <p className="mt-1 text-xs text-error">{state.fieldErrors.goal[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="agentType" className="block text-xs font-medium text-muted">
              Agent type
            </label>
            <select
              id="agentType"
              name="agentType"
              defaultValue="FULL_STACK"
              className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover"
            >
              <option value="FRONTEND">Frontend</option>
              <option value="BACKEND">Backend</option>
              <option value="FULL_STACK">Full Stack</option>
            </select>
          </div>

          <div className="flex gap-3 border-t border-default pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 rounded-lg border border-default px-4 py-2 text-sm font-medium text-tertiary transition hover:panel-bg-strong disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !selectedPath}
              className="flex-1 rounded-lg border border-accent/30 bg-accent-subtle px-4 py-2 text-sm font-medium text-accent-hover transition hover:bg-[rgb(59_130_246_/_0.2)] disabled:opacity-50"
            >
              {pending ? "Creating…" : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
