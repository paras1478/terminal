"use client";

import { useEffect, useState } from "react";

type Line = {
  type: "prompt" | "ai" | "output" | "success";
  text: string;
};

const SCRIPT: Line[] = [
  { type: "prompt", text: "fix the failing auth test and deploy to staging" },
  { type: "ai", text: "Plan: run tests → locate failure → patch → verify → deploy" },
  { type: "output", text: "$ npm test -- auth.test.ts" },
  { type: "output", text: "✗ 1 failing — expected 200, received 401 (token expiry)" },
  { type: "ai", text: "Root cause: JWT expiry check uses stale clock offset. Patching session.ts…" },
  { type: "output", text: "$ git diff src/lib/auth/session.ts" },
  { type: "success", text: "+ compare exp against Date.now() / 1000 (was cached offset)" },
  { type: "output", text: "$ npm test -- auth.test.ts" },
  { type: "success", text: "✓ 12 passed (1.4s)" },
  { type: "output", text: "$ git commit -m \"fix: correct JWT expiry comparison\"" },
  { type: "output", text: "$ npm run deploy -- --env staging" },
  { type: "success", text: "✓ Deployed to staging · https://staging.termina.ai" },
];

export default function TerminalMockup() {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    if (visible >= SCRIPT.length) {
      const reset = setTimeout(() => setVisible(1), 2600);
      return () => clearTimeout(reset);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), 650);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="overflow-hidden rounded-2xl border border-default surface-bg/90 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-default panel-bg px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-error/70" />
        <span className="h-3 w-3 rounded-full bg-warning/70" />
        <span className="h-3 w-3 rounded-full bg-success/70" />
        <span className="ml-3 font-mono text-xs text-faint">termina — agent session</span>
      </div>
      <div className="h-80 overflow-hidden p-5 font-mono text-[13px] leading-relaxed sm:h-96">
        {SCRIPT.slice(0, visible).map((line, i) => (
          <div key={i} className="mb-1.5">
            {line.type === "prompt" && (
              <div className="flex gap-2 text-secondary">
                <span className="text-accent-hover">❯</span>
                <span>{line.text}</span>
              </div>
            )}
            {line.type === "ai" && (
              <div className="flex gap-2 pl-4 text-ai">
                <span>✦</span>
                <span>{line.text}</span>
              </div>
            )}
            {line.type === "output" && (
              <div className="pl-4 text-faint">{line.text}</div>
            )}
            {line.type === "success" && (
              <div className="pl-4 text-success">{line.text}</div>
            )}
          </div>
        ))}
        {visible < SCRIPT.length && (
          <span className="inline-block h-3.5 w-2 animate-pulse bg-accent-hover align-middle" />
        )}
      </div>
    </div>
  );
}
