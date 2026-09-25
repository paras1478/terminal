"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { env } from "@/lib/env";
import { getSessionFileTreeClient } from "@/lib/api/dashboard-client";
import type { FileNode } from "@/lib/schemas/files";

type FileChangeEvent = {
  type: "add" | "addDir" | "unlink" | "unlinkDir" | "change";
  path: string;
};

function sortChildren(children: FileNode[]): FileNode[] {
  return [...children].sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function splitPath(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function insertNode(root: FileNode, relPath: string, type: "file" | "directory"): FileNode {
  const segments = splitPath(relPath);
  if (segments.length === 0) return root;

  function recurse(node: FileNode, depth: number): FileNode {
    if (depth === segments.length - 1) {
      const name = segments[depth];
      const existing = node.children?.some((c) => c.name === name);
      if (existing) return node;
      const path = segments.slice(0, depth + 1).join("/");
      const newNode: FileNode =
        type === "directory"
          ? { name, path, type: "directory", children: [] }
          : { name, path, type: "file" };
      return { ...node, children: sortChildren([...(node.children ?? []), newNode]) };
    }

    const name = segments[depth];
    const children = node.children ?? [];
    const idx = children.findIndex((c) => c.name === name && c.type === "directory");
    if (idx === -1) return node;

    const updatedChild = recurse(children[idx], depth + 1);
    const newChildren = [...children];
    newChildren[idx] = updatedChild;
    return { ...node, children: newChildren };
  }

  return recurse(root, 0);
}

function removeNode(root: FileNode, relPath: string): FileNode {
  const segments = splitPath(relPath);
  if (segments.length === 0) return root;

  function recurse(node: FileNode, depth: number): FileNode {
    const name = segments[depth];
    const children = node.children ?? [];

    if (depth === segments.length - 1) {
      return { ...node, children: children.filter((c) => c.name !== name) };
    }

    const idx = children.findIndex((c) => c.name === name && c.type === "directory");
    if (idx === -1) return node;

    const updatedChild = recurse(children[idx], depth + 1);
    const newChildren = [...children];
    newChildren[idx] = updatedChild;
    return { ...node, children: newChildren };
  }

  return recurse(root, 0);
}

function FileIcon({ node }: { node: FileNode }) {
  if (node.type === "directory") {
    return <span className="text-warning">📁</span>;
  }
  const ext = node.name.split(".").pop()?.toLowerCase();
  const iconByExt: Record<string, string> = {
    js: "📜", jsx: "📜", ts: "📘", tsx: "📘",
    json: "🧾", md: "📄", css: "🎨", html: "🌐",
    png: "🖼️", jpg: "🖼️", jpeg: "🖼️", svg: "🖼️", gif: "🖼️",
    yml: "⚙️", yaml: "⚙️", env: "🔒", lock: "🔒",
  };
  return <span>{(ext && iconByExt[ext]) || "📄"}</span>;
}

function TreeNode({
  node,
  depth,
  expanded,
  onToggle,
  selectedPath,
  onSelectFile,
}: {
  node: FileNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}) {
  const isDir = node.type === "directory";
  const isOpen = expanded.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <button
        type="button"
        onClick={() => (isDir ? onToggle(node.path) : onSelectFile(node.path))}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs hover:panel-bg-strong ${
          isSelected ? "bg-accent-subtle text-accent-hover" : "text-tertiary"
        }`}
        title={node.path}
      >
        {isDir && (
          <span className="w-3 text-faint">{isOpen ? "▾" : "▸"}</span>
        )}
        {!isDir && <span className="w-3" />}
        <FileIcon node={node} />
        <span className="truncate">{node.name}</span>
      </button>

      {isDir && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
          {node.children.length === 0 && (
            <p
              style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
              className="py-1 text-[11px] text-faint"
            >
              (empty)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({
  sessionId,
  accessToken,
  onSelectFile,
  selectedPath,
}: {
  sessionId: string;
  accessToken: string;
  onSelectFile: (path: string) => void;
  selectedPath: string | null;
}) {
  const [root, setRoot] = useState<FileNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["."]));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const tree = await getSessionFileTreeClient(sessionId, accessToken);
      setRoot(tree);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace files.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, accessToken]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    const socket = io(`${env.NEXT_PUBLIC_API_URL}/files`, {
      auth: { token: accessToken },
      query: { sessionId },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("files:change", (event: FileChangeEvent) => {
      setRoot((prev) => {
        if (!prev) return prev;
        switch (event.type) {
          case "add":
            return insertNode(prev, event.path, "file");
          case "addDir":
            return insertNode(prev, event.path, "directory");
          case "unlink":
          case "unlinkDir":
            return removeNode(prev, event.path);
          default:
            return prev;
        }
      });
    });

    socket.on("files:error", (message: string) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, accessToken]);

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-default surface-bg/90">
      <div className="flex items-center justify-between border-b border-default panel-bg px-4 py-3">
        <h2 className="font-mono text-xs text-faint">explorer</h2>
        <button
          type="button"
          onClick={loadTree}
          className="rounded-md border border-default px-2 py-0.5 text-[11px] text-muted hover:panel-bg-strong hover:text-secondary"
          title="Refresh file tree"
        >
          ↻ refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && <p className="px-2 py-1 text-xs text-faint">Loading files…</p>}
        {error && !loading && (
          <p className="px-2 py-1 text-xs text-error">{error}</p>
        )}
        {!loading && !error && root && root.children && root.children.length === 0 && (
          <p className="px-2 py-1 text-xs text-faint">This workspace is empty.</p>
        )}
        {!loading && !error && root?.children?.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    </div>
  );
}
