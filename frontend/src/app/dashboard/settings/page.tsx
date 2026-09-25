import type { Metadata } from "next";
import { getSettings } from "@/lib/api/dashboard";
import { getAccessToken } from "@/lib/auth/session";
import { SettingsForm } from "./components/settings-form";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  let error: string | null = null;
  let settings: Awaited<ReturnType<typeof getSettings>> | null = null;

  try {
    settings = await getSettings();
  } catch {
    error = "Unable to load settings right now.";
  }

  const accessToken = (await getAccessToken()) ?? "";

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Settings</h1>
        <p className="mt-1 text-sm text-faint">
          Command safety, resource limits, notifications, and model preferences.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-error/20 bg-error-subtle p-5 text-sm text-error">
          {error}
        </div>
      )}

      {settings && <SettingsForm settings={settings} accessToken={accessToken} />}
    </>
  );
}
