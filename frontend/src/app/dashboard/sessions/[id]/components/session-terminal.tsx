"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { io, type Socket } from "socket.io-client";
import { env } from "@/lib/env";
import "@xterm/xterm/css/xterm.css";

export function SessionTerminal({
  sessionId,
  accessToken,
}: {
  sessionId: string;
  accessToken: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

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

    const socket: Socket = io(`${env.NEXT_PUBLIC_API_URL}/terminal`, {
      auth: { token: accessToken },
      query: { sessionId },
      transports: ["websocket"],
    });

    socket.on("terminal:output", (data: string) => term.write(data));
    socket.on("terminal:error", (message: string) => {
      term.write(`\r\n\x1b[31m${message}\x1b[0m\r\n`);
    });
    socket.on("terminal:exit", (code: number) => {
      term.write(`\r\n\x1b[90mProcess exited with code ${code}\x1b[0m\r\n`);
    });

    const onData = term.onData((data) => {
      socket.emit("terminal:input", data);
    });

    const handleResize = () => {
      fitAddon.fit();
      socket.emit("terminal:resize", { cols: term.cols, rows: term.rows });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      onData.dispose();
      socket.disconnect();
      term.dispose();
    };
  }, [sessionId, accessToken]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12]/90">
      <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <h2 className="font-mono text-xs text-slate-500">terminal</h2>
      </div>
      <div ref={containerRef} className="min-h-[420px] flex-1 p-2" />
    </div>
  );
}
