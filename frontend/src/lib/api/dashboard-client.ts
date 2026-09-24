import { API_BASE_URL } from "@/lib/env";
import { ApiError } from "@/lib/api/auth";
import type { FileContent, FileNode } from "@/lib/schemas/files";

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

async function clientRequest<T>(
  path: string,
  accessToken: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, unknown>;
  } = {},
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
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
      Authorization: `Bearer ${accessToken}`,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getSessionFileTreeClient(
  sessionId: string,
  accessToken: string,
): Promise<FileNode> {
  return clientRequest<FileNode>(
    `/sessions/${encodeURIComponent(sessionId)}/files`,
    accessToken,
  );
}

export function getSessionFileContentClient(
  sessionId: string,
  path: string,
  accessToken: string,
): Promise<FileContent> {
  return clientRequest<FileContent>(
    `/sessions/${encodeURIComponent(sessionId)}/files/content`,
    accessToken,
    { query: { path } },
  );
}

export function saveSessionFileContentClient(
  sessionId: string,
  path: string,
  content: string,
  accessToken: string,
): Promise<{ path: string }> {
  return clientRequest<{ path: string }>(
    `/sessions/${encodeURIComponent(sessionId)}/files/content`,
    accessToken,
    { method: "PUT", query: { path }, body: { content } },
  );
}

export { ApiError };
