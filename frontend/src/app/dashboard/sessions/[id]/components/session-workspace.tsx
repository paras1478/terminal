"use client";

import { useCallback, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const resizing = useRef(false);

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

  return (
    <div
      ref={containerRef}
      className="flex h-[560px] gap-0 overflow-hidden rounded-2xl"
    >
      <div style={{ width: explorerWidth, flexShrink: 0 }} className="h-full">
        <FileExplorer
          sessionId={sessionId}
          accessToken={accessToken}
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
            <CodeViewer sessionId={sessionId} path={selectedPath} accessToken={accessToken} />
          </div>
          <div className={activeTab === "terminal" ? "h-full" : "hidden"}>
            <SessionTerminal
              sessionId={sessionId}
              workspacePath={workspacePath}
              accessToken={accessToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
