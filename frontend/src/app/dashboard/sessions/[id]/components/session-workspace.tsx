"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileExplorer } from "./file-explorer";
import { CodeViewer } from "./code-viewer";
import { SessionTerminal } from "./session-terminal";

const MIN_EXPLORER_WIDTH = 180;
const MAX_EXPLORER_WIDTH = 480;
const DEFAULT_EXPLORER_WIDTH = 260;

export function SessionWorkspace({
  sessionId,
  workspacePath,
  accessToken,
}: {
  sessionId: string;
  workspacePath: string;
  accessToken: string;
}) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "terminal">("terminal");
  const [explorerWidth, setExplorerWidth] = useState(DEFAULT_EXPLORER_WIDTH);
  const [isDesktop, setIsDesktop] = useState(false);
  // Session persistence: this session's original workspacePath is checked
  // against the real local filesystem on mount (see below). If it's gone
  // (deleted/renamed/moved externally), the user can pick a replacement
  // folder for this browser tab's lifetime only — there is no backend
  // endpoint to update a session's stored path, and adding one is out of
  // scope here; this override is intentionally client-side and not
  // persisted across reloads.
  const [effectiveWorkspacePath, setEffectiveWorkspacePath] = useState(workspacePath);
  const [workspaceMissing, setWorkspaceMissing] = useState(false);
  const [checkingWorkspace, setCheckingWorkspace] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizing = useRef(false);

  useEffect(() => {
    setIsDesktop(typeof window !== "undefined" && window.desktopBridge?.isDesktop === true);
  }, []);

  useEffect(() => {
    setEffectiveWorkspacePath(workspacePath);
  }, [workspacePath]);

  useEffect(() => {
    const bridge = window.desktopBridge;
    if (!bridge?.isDesktop) {
      setCheckingWorkspace(false);
      return;
    }
    let cancelled = false;
    setCheckingWorkspace(true);
    bridge
      .validateFolder(effectiveWorkspacePath)
      .then((result) => {
        if (cancelled) return;
        setWorkspaceMissing(!result.ok);
      })
      .finally(() => {
        if (!cancelled) setCheckingWorkspace(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveWorkspacePath]);

  async function handleSelectAnotherFolder() {
    const bridge = window.desktopBridge;
    if (!bridge) return;
    const picked = await bridge.selectFolder();
    if (picked.canceled || !picked.path) return;
    const validation = await bridge.validateFolder(picked.path);
    if (validation.ok && validation.path) {
      setEffectiveWorkspacePath(validation.path);
      setWorkspaceMissing(false);
    }
  }

  const handleSelectFile = useCallback((path: string) => {
    setSelectedPath(path);
    setActiveTab("editor");
  }, []);

  const startResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    resizing.current = true;

    const onMove = (moveEvent: PointerEvent) => {
      if (!resizing.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const next = Math.min(
        MAX_EXPLORER_WIDTH,
        Math.max(MIN_EXPLORER_WIDTH, moveEvent.clientX - rect.left),
      );
      setExplorerWidth(next);
    };

    const onUp = () => {
      resizing.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  if (isDesktop && !checkingWorkspace && workspaceMissing) {
    return (
      <div className="flex h-[560px] flex-col items-center justify-center gap-3 rounded-2xl border border-warning/20 bg-warning-subtle p-6 text-center">
        <p className="text-sm font-medium text-warning">
          Workspace folder is no longer available.
        </p>
        <p className="max-w-sm text-xs text-muted">{effectiveWorkspacePath}</p>
        <button
          type="button"
          onClick={handleSelectAnotherFolder}
          className="rounded-lg border border-accent/30 bg-accent-subtle px-4 py-2 text-sm font-medium text-accent-hover transition hover:bg-[rgb(59_130_246_/_0.2)]"
        >
          Select Another Folder
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-[560px] gap-0 overflow-hidden rounded-2xl"
    >
      <div style={{ width: explorerWidth, flexShrink: 0 }} className="h-full">
        <FileExplorer
          sessionId={sessionId}
          accessToken={accessToken}
          workspacePath={effectiveWorkspacePath}
          isDesktop={isDesktop}
          onSelectFile={handleSelectFile}
          selectedPath={selectedPath}
        />
      </div>

      <div
        onPointerDown={startResize}
        className="mx-2 hidden w-1 shrink-0 cursor-col-resize rounded panel-bg-strong hover:bg-accent/30 sm:block"
        title="Drag to resize"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`rounded-lg border px-3 py-1 text-xs font-medium ${
              activeTab === "editor"
                ? "border-accent/30 bg-accent-subtle text-accent-hover"
                : "border-default panel-bg text-muted hover:text-secondary"
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("terminal")}
            className={`rounded-lg border px-3 py-1 text-xs font-medium ${
              activeTab === "terminal"
                ? "border-accent/30 bg-accent-subtle text-accent-hover"
                : "border-default panel-bg text-muted hover:text-secondary"
            }`}
          >
            Terminal
          </button>
        </div>

        <div className="min-h-0 flex-1">
          <div className={activeTab === "editor" ? "h-full" : "hidden"}>
            <CodeViewer
              sessionId={sessionId}
              path={selectedPath}
              accessToken={accessToken}
              workspacePath={effectiveWorkspacePath}
              isDesktop={isDesktop}
            />
          </div>
          <div className={activeTab === "terminal" ? "h-full" : "hidden"}>
            <SessionTerminal
              sessionId={sessionId}
              workspacePath={effectiveWorkspacePath}
              accessToken={accessToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
