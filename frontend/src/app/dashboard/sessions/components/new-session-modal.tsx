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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-session-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 id="new-session-title" className="text-lg font-semibold text-slate-100">
            New Session
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-500 transition hover:text-slate-300"
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
              className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-300"
            >
              {state.error}
            </p>
          )}

          <div>
            <label htmlFor="path" className="block text-xs font-medium text-slate-400">
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
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-emerald-400/40"
              />
              {isElectron && (
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
                >
                  Browse…
                </button>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Enter the absolute path to a project folder already on this machine.
            </p>

            {folderError && <p className="mt-1 text-xs text-red-300">{folderError}</p>}

            {state.fieldErrors?.path && (
              <p className="mt-1 text-xs text-red-300">{state.fieldErrors.path[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-medium text-slate-400">
              Workspace name (optional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              maxLength={200}
              placeholder="my-app"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
            />
          </div>

          <div>
            <label htmlFor="goal" className="block text-xs font-medium text-slate-400">
              Goal
            </label>
            <textarea
              id="goal"
              name="goal"
              required
              maxLength={500}
              rows={3}
              placeholder="Fix the failing checkout tests"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
            />
            {state.fieldErrors?.goal && (
              <p className="mt-1 text-xs text-red-300">{state.fieldErrors.goal[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="agentType" className="block text-xs font-medium text-slate-400">
              Agent type
            </label>
            <select
              id="agentType"
              name="agentType"
              defaultValue="FULL_STACK"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-400/40"
            >
              <option value="FRONTEND">Frontend</option>
              <option value="BACKEND">Backend</option>
              <option value="FULL_STACK">Full Stack</option>
            </select>
          </div>

          <div className="flex gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !selectedPath}
              className="flex-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-50"
            >
              {pending ? "Creating…" : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
