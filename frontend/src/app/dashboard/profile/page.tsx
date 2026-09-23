import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const initials = (user.firstName?.[0] ?? user.email[0]).toUpperCase();
  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user.email;
  const roleLabel = user.role === "ADMIN" ? "Administrator" : "Developer";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Profile</h1>
        <p className="mt-1 text-sm text-faint">Your account information.</p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-default panel-bg p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 font-mono text-xl font-semibold text-emerald-300">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-primary">{displayName}</p>
          <p className="text-sm text-faint">{roleLabel}</p>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-default panel-bg p-6">
        <h2 className="font-semibold text-primary">Account information</h2>
        <dl className="mt-4 divide-y divide-white/10">
          <div className="flex items-center justify-between py-3 text-sm">
            <dt className="text-faint">Name</dt>
            <dd className="text-secondary">{displayName}</dd>
          </div>
          <div className="flex items-center justify-between py-3 text-sm">
            <dt className="text-faint">Email</dt>
            <dd className="text-secondary">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between py-3 text-sm">
            <dt className="text-faint">Role</dt>
            <dd className="text-secondary">{roleLabel}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
