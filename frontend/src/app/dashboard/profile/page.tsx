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
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your account information.</p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 font-mono text-xl font-semibold text-emerald-300">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-100">{displayName}</p>
          <p className="text-sm text-slate-500">{roleLabel}</p>
          <p className="mt-1 text-sm text-slate-400">{user.email}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold text-slate-100">Account information</h2>
        <dl className="mt-4 divide-y divide-white/10">
          <div className="flex items-center justify-between py-3 text-sm">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-slate-200">{displayName}</dd>
          </div>
          <div className="flex items-center justify-between py-3 text-sm">
            <dt className="text-slate-500">Email</dt>
            <dd className="text-slate-200">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between py-3 text-sm">
            <dt className="text-slate-500">Role</dt>
            <dd className="text-slate-200">{roleLabel}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
