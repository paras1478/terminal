"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { env } from "@/lib/env";
import { showSessionNotification } from "@/lib/notifications/show-notification";
import { useToast } from "@/components/toast/toast-provider";

type ActivityType =
  | "thinking"
  | "read_file"
  | "list_directory"
  | "proposed_change"
  | "file_written"
  | "command"
  | "command_output"
  | "confirmation_required"
  | "error"
  | "done";

interface ActivityEvent {
  type: ActivityType;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface PendingConfirmation {
  confirmationId: string;
  kind: string;
  description: string;
}

export function AgentPanel({
  sessionId,
  accessToken,
  notifyOnCompletion = true,
  notifyOnFailure = true,
}: {
  sessionId: string;
  accessToken: string;
  notifyOnCompletion?: boolean;
  notifyOnFailure?: boolean;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [goal, setGoal] = useState("");
  const [running, setRunning] = useState(false);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const socket = io(`${env.NEXT_PUBLIC_API_URL}/agent`, {
      auth: { token: accessToken },
      query: { sessionId },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("agent:activity", (event: ActivityEvent) => {
      setActivity((prev) => [...prev, event]);
      if (event.type === "confirmation_required") {
        setPendingConfirmation({
          confirmationId: String(event.payload.confirmationId),
          kind: String(event.payload.kind),
          description: String(event.payload.description),
        });
      }
      if (event.type === "done") {
        setRunning(false);
        if (notifyOnCompletion) {
          const message = String(event.payload.message ?? "Task completed.");
          showToast(message, "success");
          void showSessionNotification("Task completed", message);
          window.dispatchEvent(new Event("notifications:refresh"));
        }
      }
      if (event.type === "error") {
        setRunning(false);
        if (notifyOnFailure) {
          const message = String(event.payload.message ?? "Task failed.");
          showToast(message, "error");
          void showSessionNotification("Task failed", message);
          window.dispatchEvent(new Event("notifications:refresh"));
        }
      }
    });

    socket.on("agent:stopped", () => setRunning(false));
    socket.on("agent:error", (message: string) => {
      setActivity((prev) => [
        ...prev,
        { type: "error", payload: { message }, createdAt: new Date().toISOString() },
      ]);
      setRunning(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, accessToken, notifyOnCompletion, notifyOnFailure, showToast]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [activity]);

  function handleRun() {
    if (!goal.trim() || running) return;
    setRunning(true);
    setActivity([]);
    socketRef.current?.emit("agent:run", goal.trim());
  }

  function handleStop() {
    socketRef.current?.emit("agent:stop");
    setRunning(false);
  }

  function handleConfirm(approved: boolean) {
    if (!pendingConfirmation) return;
    socketRef.current?.emit("agent:confirm", {
      confirmationId: pendingConfirmation.confirmationId,
      approved,
    });
    setPendingConfirmation(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-default panel-bg backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-default px-4 py-3">
        <h2 className="font-semibold text-primary">AI Agent</h2>
        <div className="flex gap-2">
          {running ? (
            <button
              type="button"
              onClick={handleStop}
              className="rounded-lg border border-error/30 bg-error-subtle px-3 py-1.5 text-xs font-medium text-error hover:bg-[rgb(251_113_133_/_0.2)]"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRun}
              disabled={!goal.trim()}
              className="rounded-lg border border-success/30 bg-success-subtle px-3 py-1.5 text-xs font-medium text-success hover:bg-[rgb(52_211_153_/_0.2)] disabled:opacity-50"
            >
              Run
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={running}
          rows={2}
          placeholder="e.g. Install dependencies, run the dev server, and fix any startup errors"
          className="w-full rounded-lg border border-default panel-bg px-3 py-2 text-sm text-secondary outline-none focus:border-accent-hover disabled:opacity-50"
        />

        {pendingConfirmation && (
          <div className="rounded-lg border border-warning/30 bg-warning-subtle p-3">
            <p className="text-xs font-medium text-warning">Confirmation required</p>
            <p className="mt-1 break-all font-mono text-xs text-secondary">
              {pendingConfirmation.description}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleConfirm(true)}
                className="rounded-lg border border-success/30 bg-success-subtle px-3 py-1 text-xs font-medium text-success hover:bg-[rgb(52_211_153_/_0.2)]"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => handleConfirm(false)}
                className="rounded-lg border border-error/30 bg-error-subtle px-3 py-1 text-xs font-medium text-error hover:bg-[rgb(251_113_133_/_0.2)]"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        <div
          ref={feedRef}
          className="h-[360px] space-y-2 overflow-y-auto rounded-lg border border-default surface-bg/90 p-3 font-mono text-xs"
        >
          {activity.length === 0 && (
            <p className="text-faint">No activity yet. Enter a goal and click Run.</p>
          )}
          {activity.map((event, i) => (
            <ActivityLine key={i} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityLine({ event }: { event: ActivityEvent }) {
  switch (event.type) {
    case "thinking":
      return <p className="text-muted">{String(event.payload.text)}</p>;
    case "list_directory":
      return <p className="text-ai">$ ls {String(event.payload.path)}</p>;
    case "read_file":
      return (
        <p className="text-ai">
          reading {String(event.payload.path)}
          {event.payload.blocked ? " (blocked: secret file)" : ""}
        </p>
      );
    case "proposed_change":
      return (
        <div className="rounded border border-ai/20 bg-ai-subtle p-2">
          <p className="text-ai">
            {event.payload.blocked ? "blocked write: " : "proposed change: "}
            {String(event.payload.path)}
          </p>
          {typeof event.payload.content === "string" && (
            <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap text-muted">
              {event.payload.content.slice(0, 2000)}
            </pre>
          )}
        </div>
      );
    case "file_written":
      return <p className="text-success">✓ wrote {String(event.payload.path)}</p>;
    case "command":
      return <p className="text-secondary">$ {String(event.payload.command)}</p>;
    case "command_output":
      return (
        <pre className="whitespace-pre-wrap pl-3 text-faint">
          {String(event.payload.output).slice(0, 4000)}
        </pre>
      );
    case "confirmation_required":
      return <p className="text-warning">awaiting confirmation…</p>;
    case "error":
      return <p className="text-error">error: {String(event.payload.message)}</p>;
    case "done":
      return <p className="text-success">✓ {String(event.payload.message)}</p>;
    default:
      return null;
  }
}
