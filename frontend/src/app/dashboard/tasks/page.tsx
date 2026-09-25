import type { Metadata } from "next";
import { listTasks, listWorkspaces, type TaskPriority, type TaskStatus } from "@/lib/api/dashboard";
import { CreateTaskForm } from "./components/create-task-form";

export const metadata: Metadata = {
  title: "Tasks",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  QUEUED: "border-default panel-bg-strong text-tertiary",
  RUNNING: "border-accent-hover/30 bg-accent-subtle text-accent-hover",
  COMPLETED: "border-success/30 bg-success-subtle text-success",
  FAILED: "border-error/30 bg-error-subtle text-error",
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: "border-default panel-bg-strong text-tertiary",
  MEDIUM: "border-accent-hover/30 bg-accent-subtle text-accent-hover",
  HIGH: "border-warning/30 bg-warning-subtle text-warning",
  URGENT: "border-error/30 bg-error-subtle text-error",
};

export default async function TasksPage() {
  let error: string | null = null;
  let tasks: Awaited<ReturnType<typeof listTasks>> = [];
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];

  try {
    [tasks, workspaces] = await Promise.all([listTasks(), listWorkspaces()]);
  } catch {
    error = "Unable to load tasks right now.";
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Tasks</h1>
        <p className="mt-1 text-sm text-faint">Queue and track automation tasks.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-error/20 bg-error-subtle p-5 text-sm text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tasks.length === 0 && !error ? (
            <div className="rounded-2xl border border-default panel-bg p-8 text-center text-sm text-muted">
              No tasks yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-default panel-bg backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-default text-xs uppercase tracking-wide text-faint">
                      <th className="px-5 py-3 font-medium">Task</th>
                      <th className="px-5 py-3 font-medium">Workspace</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Priority</th>
                      <th className="px-5 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} className="border-b border-subtle transition hover:panel-bg">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-secondary">{task.name}</div>
                          <div className="max-w-xs truncate text-xs text-faint">
                            {task.description}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted">{task.workspaceName}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[task.status]}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-faint">
                          {new Date(task.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-default panel-bg p-5 backdrop-blur-xl">
          <h3 className="font-semibold text-primary">Create Task</h3>
          <div className="mt-4">
            <CreateTaskForm workspaces={workspaces} />
          </div>
        </div>
      </div>
    </>
  );
}
