"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createSessionAction, type ActionResult } from "@/lib/dashboard/actions";

const initialState: ActionResult = { error: null, fieldErrors: {} };

function basenameOf(fullPath: string): string {
  const trimmed = fullPath.replace(/[\\/]+$/, "");
  const segments = trimmed.split(/[\\/]/);
  return segments[segments.length - 1] || trimmed;
}

export function NewSessionModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createSessionAction, initialState);
  const [selectedPath, setSelectedPath] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);

  useEffect(() => {
    setIsDesktop(typeof window !== "undefined" && window.desktopBridge?.isDesktop === true);
  }, []);

  useEffect(() => {
    if (state.success && state.sessionId) {
      onClose();
      router.push(`/dashboard/sessions/${state.sessionId}`);
    }
  }, [state.success, state.sessionId, onClose, router]);

  async function handleSelectFolder() {
    setFolderError(null);
    setPickerBusy(true);
    try {
      const bridge = window.desktopBridge;
      if (!bridge) return;

      const picked = await bridge.selectFolder();
      if (picked.canceled || !picked.path) {
        return;
      }

      const validation = await bridge.validateFolder(picked.path);
      if (!validation.ok || !validation.path) {
        setFolderError(validation.error ?? "Selected folder does not exist.");
        return;
      }

      setSelectedPath(validation.path);
      setWorkspaceName((prev) => prev || basenameOf(validation.path!));
    } catch {
      setFolderError("Unable to open the folder picker. Please try again.");
    } finally {
      setPickerBusy(false);
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

            {isDesktop ? (
              <>
                <div className="mt-1 flex gap-2">
                  <input
                    id="path"
                    name="path"
                    type="text"
                    value={selectedPath}
                    readOnly
                    placeholder="No folder selected"
                    className="w-full cursor-not-allowed rounded-lg border border-default panel-bg px-3 py-2 font-mono text-sm text-secondary outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSelectFolder}
                    disabled={pickerBusy}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-default panel-bg px-3 py-2 text-sm font-medium text-secondary transition hover:border-accent-hover hover:panel-bg-strong disabled:opacity-50"
                  >
                    <span aria-hidden="true">📁</span>
                    {pickerBusy ? "Selecting folder…" : "Select Folder"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-faint">
                  Choose a folder on this computer. Only a real, accessible directory can be
                  used — you cannot type a path or command here.
                </p>
              </>
            ) : (
              <>
                <input
                  id="path"
                  name="path"
                  type="text"
                  value={selectedPath}
                  onChange={(e) => setSelectedPath(e.target.value)}
                  placeholder="C:\Users\you\projects\my-app"
                  className="mt-1 w-full rounded-lg border border-default panel-bg px-3 py-2 font-mono text-sm text-secondary outline-none focus:border-accent-hover"
                />
                <p className="mt-1 rounded-lg border border-warning/20 bg-warning-subtle px-3 py-2 text-xs text-warning">
                  Local folder access (native picker, Explorer, terminal) is available in the
                  Desktop app. In the browser, this path is only usable if the backend server
                  itself can already see it on disk.
                </p>
              </>
            )}

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
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
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
              disabled={pending || (isDesktop && !selectedPath)}
              className="flex-1 rounded-lg border border-accent/30 bg-accent-subtle px-4 py-2 text-sm font-medium text-accent-hover transition hover:bg-[rgb(59_130_246_/_0.2)] disabled:opacity-50"
            >
              {pending ? "Creating session…" : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
