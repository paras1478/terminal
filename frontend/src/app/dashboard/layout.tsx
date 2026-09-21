import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ToastProvider } from "@/components/toast/toast-provider";
import { Sidebar } from "./components/sidebar";
import { Topbar } from "./components/topbar";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <div className="relative flex min-h-screen w-full bg-[#05060a] text-slate-100">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(0,255,180,0.12),transparent_45%),radial-gradient(circle_at_90%_0%,rgba(124,58,237,0.14),transparent_40%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar user={user} />

          <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
