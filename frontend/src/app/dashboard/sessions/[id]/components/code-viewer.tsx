"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  getSessionFileContentClient,
  saveSessionFileContentClient,
} from "@/lib/api/dashboard-client";

const LANGUAGE_BY_EXT: Record<string, string> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "typescript",
  json: "json", md: "markdown", css: "css", scss: "scss", html: "html",
  yml: "yaml", yaml: "yaml", py: "python", go: "go", rs: "rust",
  java: "java", c: "c", cpp: "cpp", cs: "csharp", sh: "shell",
  sql: "sql", xml: "xml", prisma: "graphql",
};

function languageForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGE_BY_EXT[ext] ?? "plaintext";
}

export function CodeViewer({
  sessionId,
  path,
  accessToken,
}: {
  sessionId: string;
  path: string | null;
  accessToken: string;
}) {
  const [content, setContent] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDirty(false);

    getSessionFileContentClient(sessionId, path, accessToken)
      .then((res) => {
        if (cancelled) return;
        setContent(res.content);
        setTruncated(res.truncated);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load file.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, path, accessToken]);

  async function handleSave() {
    if (!path) return;
    setSaving(true);
    try {
      await saveSessionFileContentClient(sessionId, path, content, accessToken);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save file.");
    } finally {
      setSaving(false);
    }
  }

  if (!path) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-default surface-bg/90">
        <p className="text-sm text-faint">Select a file from the explorer to view it.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-default surface-bg/90">
      <div className="flex items-center justify-between border-b border-default panel-bg px-4 py-3">
        <h2 className="truncate font-mono text-xs text-muted" title={path}>
          {path}
          {dirty && <span className="ml-1 text-amber-400">●</span>}
        </h2>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {truncated && (
        <p className="border-b border-amber-400/20 bg-amber-400/5 px-4 py-1.5 text-[11px] text-amber-300">
          File is large — showing a truncated preview.
        </p>
      )}

      <div className="flex-1">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-faint">Loading file…</p>
          </div>
        )}
        {error && !loading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        {!loading && !error && (
          <Editor
            height="100%"
            language={languageForPath(path)}
            value={content}
            theme="vs-dark"
            onChange={(value) => {
              setContent(value ?? "");
              setDirty(true);
            }}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              readOnly: truncated,
              scrollBeyondLastLine: false,
            }}
          />
        )}
      </div>
    </div>
  );
}
