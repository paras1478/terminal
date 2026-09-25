"use client";

import { useState, useTransition } from "react";
import { toggleAutomationAction } from "@/lib/dashboard/actions";

export function AutomationToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await toggleAutomationAction(id, !enabled);
            if (result.error) setError(result.error);
          });
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition disabled:opacity-50 ${
          enabled
            ? "border-accent/40 bg-accent-subtle"
            : "border-default panel-bg-strong"
        }`}
        aria-pressed={enabled}
        aria-label={enabled ? "Disable automation" : "Enable automation"}
      >
        <span
          className={`inline-block h-4.5 w-4.5 transform rounded-full transition ${
            enabled ? "translate-x-6 bg-accent-hover" : "translate-x-1 bg-[color:var(--text-faint)]"
          }`}
        />
      </button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
