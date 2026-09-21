"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAccessToken } from "@/lib/auth/session";
import {
  ApiError,
  connectIntegration,
  createAutomation,
  createSession,
  createTask,
  deleteSession,
  disconnectIntegration,
  updateAutomation,
  updateSettings,
  type AgentType,
  type CreateAutomationPayload,
  type CreateSessionPayload,
  type CreateTaskPayload,
  type TaskPriority,
  type UpdateSettingsPayload,
} from "@/lib/api/dashboard";

export interface ActionResult {
  error: string | null;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  sessionId?: string;
}

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    redirect("/login");
  }
  return token;
}

export async function createTaskAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireToken();

  const goal = String(formData.get("goal") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "").trim();
  const schedule = String(formData.get("schedule") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};
  if (!goal) fieldErrors.goal = ["Goal is required"];
  if (!description) fieldErrors.description = ["Description is required"];
  if (!workspaceId) fieldErrors.workspaceId = ["Workspace is required"];

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  const payload: CreateTaskPayload = {
    goal,
    description,
    workspaceId,
  };
  if (priorityRaw) payload.priority = priorityRaw as TaskPriority;
  if (schedule) payload.schedule = new Date(schedule).toISOString();
  if (tagsRaw) {
    payload.tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  try {
    await createTask(payload);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to create task right now." };
  }

  revalidatePath("/dashboard/tasks");
  return { error: null };
}

export async function createSessionAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireToken();

  const path = String(formData.get("path") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const agentTypeRaw = String(formData.get("agentType") ?? "").trim();

  const fieldErrors: Record<string, string[]> = {};
  if (!path) fieldErrors.path = ["Project location is required"];
  if (!goal) fieldErrors.goal = ["Goal is required"];

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  const payload: CreateSessionPayload = { path, goal };
  if (name) payload.name = name;
  if (agentTypeRaw) payload.agentType = agentTypeRaw as AgentType;

  let session: Awaited<ReturnType<typeof createSession>>;
  try {
    session = await createSession(payload);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to create session right now." };
  }

  revalidatePath("/dashboard/sessions");
  return { error: null, success: true, sessionId: session.id };
}

export async function createAutomationAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireToken();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const taskGoal = String(formData.get("taskGoal") ?? "").trim();
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  const schedule = String(formData.get("schedule") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  const fieldErrors: Record<string, string[]> = {};
  if (!name) fieldErrors.name = ["Name is required"];
  if (!description) fieldErrors.description = ["Description is required"];
  if (!taskGoal) fieldErrors.taskGoal = ["Task goal is required"];
  if (!workspaceId) fieldErrors.workspaceId = ["Workspace is required"];
  if (!schedule) fieldErrors.schedule = ["Schedule is required"];

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  const payload: CreateAutomationPayload = {
    name,
    description,
    taskGoal,
    workspaceId,
    schedule,
    enabled,
  };

  try {
    await createAutomation(payload);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to create automation right now." };
  }

  revalidatePath("/dashboard/automations");
  return { error: null };
}

export async function deleteSessionAction(id: string): Promise<ActionResult> {
  await requireToken();

  try {
    await deleteSession(id);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to delete this session right now." };
  }

  revalidatePath("/dashboard/sessions");
  return { error: null, success: true };
}

export async function toggleAutomationAction(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  await requireToken();

  try {
    await updateAutomation(id, { enabled });
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to update automation right now." };
  }

  revalidatePath("/dashboard/automations");
  return { error: null };
}

export async function connectIntegrationAction(key: string): Promise<ActionResult> {
  await requireToken();

  try {
    await connectIntegration(key);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to connect integration right now." };
  }

  revalidatePath("/dashboard/integrations");
  return { error: null };
}

export async function disconnectIntegrationAction(key: string): Promise<ActionResult> {
  await requireToken();

  try {
    await disconnectIntegration(key);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to disconnect integration right now." };
  }

  revalidatePath("/dashboard/integrations");
  return { error: null };
}

export async function updateSettingsAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireToken();

  const payload: UpdateSettingsPayload = {
    confirmationRequired: formData.get("confirmationRequired") === "on",
    notifyOnCompletion: formData.get("notifyOnCompletion") === "on",
    notifyOnFailure: formData.get("notifyOnFailure") === "on",
    notifyByEmail: formData.get("notifyByEmail") === "on",
    theme: String(formData.get("theme") ?? "dark"),
    modelSelection: String(formData.get("modelSelection") ?? ""),
  };

  const maxStepsPerTask = Number(formData.get("maxStepsPerTask"));
  const maxRuntimeSeconds = Number(formData.get("maxRuntimeSeconds"));
  const maxConcurrentSessions = Number(formData.get("maxConcurrentSessions"));

  const fieldErrors: Record<string, string[]> = {};
  if (!Number.isFinite(maxStepsPerTask) || maxStepsPerTask < 1 || maxStepsPerTask > 200) {
    fieldErrors.maxStepsPerTask = ["Must be between 1 and 200"];
  }
  if (
    !Number.isFinite(maxRuntimeSeconds) ||
    maxRuntimeSeconds < 10 ||
    maxRuntimeSeconds > 7200
  ) {
    fieldErrors.maxRuntimeSeconds = ["Must be between 10 and 7200"];
  }
  if (
    !Number.isFinite(maxConcurrentSessions) ||
    maxConcurrentSessions < 1 ||
    maxConcurrentSessions > 20
  ) {
    fieldErrors.maxConcurrentSessions = ["Must be between 1 and 20"];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  payload.maxStepsPerTask = maxStepsPerTask;
  payload.maxRuntimeSeconds = maxRuntimeSeconds;
  payload.maxConcurrentSessions = maxConcurrentSessions;

  const allowedPatternsRaw = String(formData.get("allowedPatterns") ?? "");
  payload.allowedPatterns = allowedPatternsRaw
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const dangerousBlocklistRaw = String(formData.get("dangerousBlocklist") ?? "");
  payload.dangerousBlocklist = dangerousBlocklistRaw
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const apiKeyProvider = String(formData.get("apiKeyProvider") ?? "").trim();
  const apiKeyValue = String(formData.get("apiKeyValue") ?? "").trim();
  if (apiKeyProvider && apiKeyValue) {
    payload.apiKeys = { [apiKeyProvider]: apiKeyValue };
  }

  try {
    await updateSettings(payload);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Unable to update settings right now." };
  }

  revalidatePath("/dashboard/settings");
  return { error: null };
}
