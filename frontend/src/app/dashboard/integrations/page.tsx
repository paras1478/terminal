import type { Metadata } from "next";
import { listIntegrations } from "@/lib/api/dashboard";
import { IntegrationActions } from "./components/integration-actions";

export const metadata: Metadata = {
  title: "Integrations",
};

export default async function IntegrationsPage() {
  let error: string | null = null;
  let integrations: Awaited<ReturnType<typeof listIntegrations>> = [];

  try {
    integrations = await listIntegrations();
  } catch {
    error = "Unable to load integrations right now.";
  }

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Integrations</h1>
        <p className="mt-1 text-sm text-slate-500">Connect external tools and services.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {integrations.length === 0 && !error && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-400">
          No integrations available.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <div
            key={integration.key}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-200">{integration.name}</p>
                <p className="mt-1 text-xs text-slate-500">{integration.description}</p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
                  integration.status === "CONNECTED"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-slate-400/30 bg-slate-400/10 text-slate-400"
                }`}
              >
                {integration.status === "CONNECTED" ? "Connected" : "Not connected"}
              </span>
            </div>
            {integration.connectedAt && (
              <p className="mt-3 text-xs text-slate-500">
                Connected {new Date(integration.connectedAt).toLocaleString()}
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <IntegrationActions integrationKey={integration.key} status={integration.status} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
