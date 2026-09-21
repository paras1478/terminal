"use client";

import { useState, useTransition } from "react";
import {
  connectIntegrationAction,
  disconnectIntegrationAction,
} from "@/lib/dashboard/actions";
import type { IntegrationStatus } from "@/lib/api/dashboard";

export function IntegrationActions({
  integrationKey,
  status,
}: {
  integrationKey: string;
  status: IntegrationStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isConnected = status === "CONNECTED";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const action = isConnected ? disconnectIntegrationAction : connectIntegrationAction;
            const result = await action(integrationKey);
            if (result.error) setError(result.error);
          });
        }}
        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
          isConnected
            ? "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"
            : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
        }`}
      >
        {pending ? "Working…" : isConnected ? "Disconnect" : "Connect"}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
