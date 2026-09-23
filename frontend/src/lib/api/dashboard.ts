import { env } from "@/lib/env";
import { getAccessToken } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/auth";

export interface StatWithDelta {
  value: number;
  changePct: number;
}

export interface OverviewStats {
  totalCommands: StatWithDelta;
  successfulCommands: StatWithDelta;
  failedCommands: StatWithDelta;
  activeSessions: StatWithDelta;
  uptimePct: number;
}

export interface PlanStep {
  order: number;
  label: string;
  done: boolean;
}

export interface SessionStep {
  order: number;
  type: string;
  command?: string;
  output?: string;
  exitStatus?: number;
  createdAt: string;
}

export interface LiveSession {
  id: string;
  workspaceId: string;
  workspaceName: string;
  goal: string;
  status: string;
  plan: PlanStep[];
  steps: SessionStep[];
  startedAt: string;
  commandsCount: number;
}

export type SessionStatus = "RUNNING" | "COMPLETED" | "FAILED";

export interface SessionSummary {
  id: string;
  workspaceId: string;
  workspaceName: string;
  goal: string;
  status: SessionStatus;
  startedAt: string;
  durationSeconds: number | null;
  commandsCount: number;
  lastActivityAt: string;
}

export interface PaginatedSessions {
  items: SessionSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export type AgentType = "FRONTEND" | "BACKEND" | "FULL_STACK";

export interface CreateSessionPayload {
  path: string;
  name?: string;
  goal: string;
  agentType?: AgentType;
}

export interface SessionDetail {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspacePath: string;
  goal: string;
  status: SessionStatus;
  plan: PlanStep[];
  timeline: SessionStep[];
  startedAt: string;
  completedAt: string | null;
  commandsCount: number;
}

export type TaskStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  workspaceName: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  scheduledAt: string | null;
  createdAt: string;
}

export interface CreateTaskPayload {
  goal: string;
  description: string;
  workspaceId: string;
  priority?: TaskPriority;
  schedule?: string;
  tags?: string[];
}

export interface Workspace {
  id: string;
  name: string;
  pathOrRepoUrl: string;
  languageStack: string;
  recentActivity: string;
  sessionsCount: number;
  tasksCount: number;
  createdAt: string;
}

export type IntegrationStatus = "CONNECTED" | "NOT_CONNECTED";

export interface WorkspaceIntegrationSummary {
  key: string;
  name: string;
  status: IntegrationStatus;
}

export interface RecentSessionSummary {
  id: string;
  goal: string;
  status: SessionStatus;
  startedAt: string;
}

export interface RecentTaskSummary {
  id: string;
  name: string;
  status: TaskStatus;
}

export interface WorkspaceDetail extends Workspace {
  logsCount: number;
  integrations: WorkspaceIntegrationSummary[];
  recentSessions: RecentSessionSummary[];
  recentTasks: RecentTaskSummary[];
}

export type LastRunStatus = "SUCCESS" | "FAILED" | "PENDING";

export interface Automation {
  id: string;
  name: string;
  description: string;
  schedule: string;
  workspaceId: string;
  workspaceName: string;
  nextRunAt: string;
  lastRunAt: string | null;
  lastRunStatus: LastRunStatus;
  enabled: boolean;
  taskGoal: string;
  createdAt: string;
}

export interface CreateAutomationPayload {
  name: string;
  description: string;
  taskGoal: string;
  workspaceId: string;
  schedule: string;
  enabled?: boolean;
}

export interface UpdateAutomationPayload {
  name?: string;
  description?: string;
  schedule?: string;
  enabled?: boolean;
}

export interface LogSummary {
  id: string;
  timestamp: string;
  sessionId: string | null;
  workspaceId: string;
  workspaceName: string;
  command: string;
  exitStatus: number;
  outputPreview: string;
}

export interface PaginatedLogs {
  items: LogSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LogDetail extends LogSummary {
  fullOutput: string;
}

export interface LogsQuery {
  page?: number;
  pageSize?: number;
  workspaceId?: string;
  status?: "success" | "failed";
  q?: string;
  from?: string;
  to?: string;
}

export interface Integration {
  key: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  connectedAt: string | null;
  config: Record<string, unknown> | null;
}

export type AiProviderId = "openai" | "anthropic" | "google";

export interface AvailableModel {
  id: string;
  provider: AiProviderId;
  label: string;
  available: boolean;
}

export interface Settings {
  confirmationRequired: boolean;
  allowedPatterns: string[];
  dangerousBlocklist: string[];
  maxStepsPerTask: number;
  maxRuntimeSeconds: number;
  maxConcurrentSessions: number;
  notifyOnCompletion: boolean;
  notifyOnFailure: boolean;
  notifyByEmail: boolean;
  theme: string;
  modelSelection: string;
  apiKeys: Record<string, unknown>;
  availableModels: AvailableModel[];
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  confirmationRequired?: boolean;
  allowedPatterns?: string[];
  dangerousBlocklist?: string[];
  maxStepsPerTask?: number;
  maxRuntimeSeconds?: number;
  maxConcurrentSessions?: number;
  notifyOnCompletion?: boolean;
  notifyOnFailure?: boolean;
  notifyByEmail?: boolean;
  theme?: string;
  modelSelection?: string;
  apiKeys?: Record<string, string>;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
    ) {
      return (body as { message: string }).message;
    }
  } catch {
    // response body was not JSON; fall through to default message
  }
  return "Something went wrong. Please try again.";
}

async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, unknown>;
  } = {},
): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError("Not authenticated", 401);
  }

  const url = new URL(`${env.NEXT_PUBLIC_API_URL}${path}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getOverviewStats(): Promise<OverviewStats> {
  return request<OverviewStats>("/overview/stats");
}

export async function getLiveSession(): Promise<LiveSession | null> {
  try {
    return await request<LiveSession>("/overview/live-session");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export function listSessions(query: {
  page?: number;
  pageSize?: number;
  status?: SessionStatus;
  workspaceId?: string;
}): Promise<PaginatedSessions> {
  return request<PaginatedSessions>("/sessions", { query });
}

export function getSession(id: string): Promise<SessionDetail> {
  return request<SessionDetail>(`/sessions/${encodeURIComponent(id)}`);
}

export function createSession(payload: CreateSessionPayload): Promise<SessionDetail> {
  return request<SessionDetail>("/sessions", { method: "POST", body: payload });
}

export function deleteSession(id: string): Promise<void> {
  return request<void>(`/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function listTasks(query: {
  status?: TaskStatus;
  workspaceId?: string;
} = {}): Promise<Task[]> {
  return request<Task[]>("/tasks", { query });
}

export function createTask(payload: CreateTaskPayload): Promise<Task> {
  return request<Task>("/tasks", { method: "POST", body: payload });
}

export function listWorkspaces(): Promise<Workspace[]> {
  return request<Workspace[]>("/workspaces");
}

export function getWorkspace(id: string): Promise<WorkspaceDetail> {
  return request<WorkspaceDetail>(`/workspaces/${encodeURIComponent(id)}`);
}

export function listAutomations(): Promise<Automation[]> {
  return request<Automation[]>("/automations");
}

export function createAutomation(payload: CreateAutomationPayload): Promise<Automation> {
  return request<Automation>("/automations", { method: "POST", body: payload });
}

export function updateAutomation(
  id: string,
  payload: UpdateAutomationPayload,
): Promise<Automation> {
  return request<Automation>(`/automations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

export function listLogs(query: LogsQuery): Promise<PaginatedLogs> {
  return request<PaginatedLogs>("/logs", { query: { ...query } });
}

export function getLog(id: string): Promise<LogDetail> {
  return request<LogDetail>(`/logs/${encodeURIComponent(id)}`);
}

export function listIntegrations(): Promise<Integration[]> {
  return request<Integration[]>("/integrations");
}

export function connectIntegration(
  key: string,
  config?: Record<string, unknown>,
): Promise<Integration> {
  return request<Integration>(`/integrations/${encodeURIComponent(key)}/connect`, {
    method: "POST",
    body: { config },
  });
}

export function disconnectIntegration(key: string): Promise<Integration> {
  return request<Integration>(`/integrations/${encodeURIComponent(key)}/disconnect`, {
    method: "POST",
  });
}

export type { FileNode, FileContent } from "@/lib/schemas/files";
import type { FileNode, FileContent } from "@/lib/schemas/files";

export function getSessionFileTree(sessionId: string): Promise<FileNode> {
  return request<FileNode>(`/sessions/${encodeURIComponent(sessionId)}/files`);
}

export function getSessionFileContent(
  sessionId: string,
  path: string,
): Promise<FileContent> {
  return request<FileContent>(`/sessions/${encodeURIComponent(sessionId)}/files/content`, {
    query: { path },
  });
}

export function saveSessionFileContent(
  sessionId: string,
  path: string,
  content: string,
): Promise<{ path: string }> {
  return request<{ path: string }>(
    `/sessions/${encodeURIComponent(sessionId)}/files/content`,
    { method: "PUT", query: { path }, body: { content } },
  );
}

export function getSettings(): Promise<Settings> {
  return request<Settings>("/settings");
}

export function updateSettings(payload: UpdateSettingsPayload): Promise<Settings> {
  return request<Settings>("/settings", { method: "PATCH", body: payload });
}

export function deleteApiKey(provider: string): Promise<Settings> {
  return request<Settings>(`/settings/api-keys/${encodeURIComponent(provider)}`, {
    method: "DELETE",
  });
}

export function validateApiKey(
  provider: string,
  apiKey: string,
): Promise<{ valid: boolean; message?: string }> {
  return request<{ valid: boolean; message?: string }>("/settings/api-keys/validate", {
    method: "POST",
    body: { provider, apiKey },
  });
}

export type NotificationType = "SESSION_COMPLETED" | "SESSION_FAILED";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  sessionId: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: AppNotification[];
  unreadCount: number;
}

export function getNotifications(): Promise<NotificationsListResponse> {
  return request<NotificationsListResponse>("/notifications");
}

export function markNotificationRead(id: string): Promise<AppNotification> {
  return request<AppNotification>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead(): Promise<{ count: number }> {
  return request<{ count: number }>("/notifications/read-all", { method: "PATCH" });
}

export { ApiError };
