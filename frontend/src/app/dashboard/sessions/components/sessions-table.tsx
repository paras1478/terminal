"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteSessionAction } from "@/lib/dashboard/actions";
import { useToast } from "@/components/toast/toast-provider";
import type { SessionStatus } from "@/lib/api/dashboard";

interface SessionRow {
  id: string;
  goal: string;
  workspaceName: string;
  status: SessionStatus;
  startedAt: string;
  durationSeconds: number | null;
  commandsCount: number;
  lastActivityAt: string;
}

const STATUS_STYLES: Record<SessionStatus, string> = {
  RUNNING: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  COMPLETED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  FAILED: "border-red-400/30 bg-red-400/10 text-red-300",
};

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function SessionsTable({ initialItems }: { initialItems: SessionRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleDeleteClick(id: string) {
    setConfirmingId(id);
  }

  function handleCancel() {
    setConfirmingId(null);
  }

  function handleConfirmDelete() {
    if (!confirmingId) return;
    const id = confirmingId;
    setConfirmingId(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteSessionAction(id);
      setPendingId(null);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      showToast("Session deleted.", "success");
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-default panel-bg p-8 text-center text-sm text-muted">
        No sessions yet.
      </div>
    );
  }

  return (
    <>
      {confirmingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-session-title"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-default surface-bg shadow-2xl backdrop-blur-xl">
            <div className="px-6 py-5">
              <h2 id="delete-session-title" className="text-base font-semibold text-primary">
                Delete session
              </h2>
              <p className="mt-2 text-sm text-muted">
                Are you sure you want to delete this session? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 border-t border-default px-6 py-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-default px-4 py-2 text-sm font-medium text-tertiary transition hover:panel-bg-strong"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-400/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="overflow-hidden rounded-2xl border border-default panel-bg backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-default text-xs uppercase tracking-wide text-faint">
              <th className="px-5 py-3 font-medium">Goal</th>
              <th className="px-5 py-3 font-medium">Workspace</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Started</th>
              <th className="px-5 py-3 font-medium">Duration</th>
              <th className="px-5 py-3 font-medium">Commands</th>
              <th className="px-5 py-3 font-medium">Last activity</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((session) => (
              <tr
                key={session.id}
                className="border-b border-subtle transition hover:panel-bg"
              >
                <td className="px-5 py-3.5">
                  <Link
                    href={`/dashboard/sessions/${session.id}`}
                    className="font-medium text-secondary hover:text-emerald-300"
                  >
                    {session.goal}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-muted">{session.workspaceName}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[session.status]}`}
                  >
                    {session.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-faint">
                  {new Date(session.startedAt).toLocaleString()}
                </td>
                <td className="px-5 py-3.5 font-mono text-muted">
                  {formatDuration(session.durationSeconds)}
                </td>
                <td className="px-5 py-3.5 text-muted">{session.commandsCount}</td>
                <td className="px-5 py-3.5 text-faint">
                  {new Date(session.lastActivityAt).toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(session.id)}
                    disabled={pendingId === session.id}
                    aria-label="Delete session"
                    title="Delete session"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-default px-2.5 py-1.5 text-xs font-medium text-muted transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                      <path
                        d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {pendingId === session.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
