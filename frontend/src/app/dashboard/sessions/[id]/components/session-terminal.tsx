"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { io, type Socket } from "socket.io-client";
import { env } from "@/lib/env";
import "@xterm/xterm/css/xterm.css";

/**
 * Renders an interactive terminal for a session's workspace.
 *
 * The backend may run on a different machine entirely (e.g. Render) and has
 * no access to the user's local filesystem, so it cannot host a real shell
 * for a local project — see backend/src/sessions/terminal.gateway.ts's own
 * doc comment. When running inside the Electron desktop app, this component
 * uses Electron's own local node-pty (via window.desktopBridge, see
 * electron/src/main.js) so the terminal actually runs against the user's
 * real files. In a plain browser (no Electron), it falls back to the
 * backend's Socket.IO terminal gateway, which only works if the backend
 * process happens to share a filesystem with the workspace path (e.g. local
 * dev, or a self-hosted backend on the same machine).
 */
export function SessionTerminal({
  sessionId,
  workspacePath,
  accessToken,
}: {
  sessionId: string;
  workspacePath: string;
  accessToken: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    const term = new Terminal({
      convertEol: true,
      fontSize: 13,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      theme: { background: "#0a0c12" },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    const cleanupFns: Array<() => void> = [];

    if (typeof window !== "undefined" && window.desktopBridge?.isElectron) {
      const bridge = window.desktopBridge;

      void bridge.terminalStart(sessionId, workspacePath, term.cols, term.rows).then((result) => {
        if (disposed) return;
        if (!result.ok) {
          term.write(`\r\n\x1b[31m${result.error ?? "Failed to start terminal"}\x1b[0m\r\n`);
        }
      });

      cleanupFns.push(
        bridge.onTerminalOutput((payload) => {
          if (disposed || payload.sessionId !== sessionId) return;
          term.write(payload.data);
        }),
      );
      cleanupFns.push(
        bridge.onTerminalExit((payload) => {
          if (disposed || payload.sessionId !== sessionId) return;
          term.write(`\r\n\x1b[90mProcess exited with code ${payload.exitCode}\x1b[0m\r\n`);
        }),
      );

      const onData = term.onData((data) => {
        if (disposed) return;
        void bridge.terminalInput(sessionId, data);
      });
      cleanupFns.push(() => onData.dispose());

      const handleResize = () => {
        if (disposed) return;
        fitAddon.fit();
        void bridge.terminalResize(sessionId, term.cols, term.rows);
      };
      window.addEventListener("resize", handleResize);
      cleanupFns.push(() => window.removeEventListener("resize", handleResize));
      cleanupFns.push(() => void bridge.terminalKill(sessionId));
    } else {
      const socket: Socket = io(`${env.NEXT_PUBLIC_API_URL}/terminal`, {
        auth: { token: accessToken },
        query: { sessionId },
        transports: ["websocket"],
      });

      // Guards against a stale connection (e.g. React StrictMode's mount/cleanup/mount
      // in dev) writing into a terminal instance that has already been disposed.
      socket.on("terminal:output", (data: string) => {
        if (disposed) return;
        term.write(data);
      });
      socket.on("terminal:error", (message: string) => {
        if (disposed) return;
        term.write(`\r\n\x1b[31m${message}\x1b[0m\r\n`);
      });
      socket.on("terminal:exit", (code: number) => {
        if (disposed) return;
        term.write(`\r\n\x1b[90mProcess exited with code ${code}\x1b[0m\r\n`);
      });

      const onData = term.onData((data) => {
        if (disposed) return;
        socket.emit("terminal:input", data);
      });
      cleanupFns.push(() => onData.dispose());

      const handleResize = () => {
        if (disposed) return;
        fitAddon.fit();
        socket.emit("terminal:resize", { cols: term.cols, rows: term.rows });
      };
      window.addEventListener("resize", handleResize);
      cleanupFns.push(() => window.removeEventListener("resize", handleResize));
      cleanupFns.push(() => socket.disconnect());
    }

    return () => {
      disposed = true;
      for (const cleanup of cleanupFns) cleanup();
      term.dispose();
    };
  }, [sessionId, workspacePath, accessToken]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-default surface-bg/90">
      <div className="border-b border-default panel-bg px-4 py-3">
        <h2 className="font-mono text-xs text-faint">terminal</h2>
      </div>
      <div ref={containerRef} className="min-h-[420px] flex-1 p-2" />
    </div>
  );
}
