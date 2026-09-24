import { redirect } from "next/navigation";
import { getAccessToken, destroySession } from "@/lib/auth/session";
import { fetchCurrentUser, ApiError } from "@/lib/api/auth";
import { getSettings } from "@/lib/api/dashboard";
import { ToastProvider } from "@/components/toast/toast-provider";
import { ThemeProvider, type ThemePreference } from "@/components/theme/theme-provider";
import { Sidebar } from "./components/sidebar";
import { Topbar } from "./components/topbar";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  // Real, backend-validated auth check — NOT just reading the client-editable
  // `user` cookie. GET /auth/me queries the database on every request (via
  // JwtStrategy.validate), so a token whose user was deleted from MongoDB is
  // rejected here with 401 even though the JWT itself hasn't expired yet.
  //
  // redirect() throws internally (NEXT_REDIRECT) and Next.js explicitly
  // requires it be called OUTSIDE any try/catch — calling it inside a catch
  // block risks the thrown redirect being treated as a real unhandled error
  // (a 401 rendering as a generic server error page) instead of navigating.
  // So the catch here only classifies the error and clears cookies; the
  // actual redirect happens after the try/catch has fully exited.
  let user;
  let shouldRedirectToLogin = false;
  try {
    user = await fetchCurrentUser(accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await destroySession();
      shouldRedirectToLogin = true;
    } else {
      throw err;
    }
  }

  if (shouldRedirectToLogin || !user) {
    redirect("/login");
  }

  let initialTheme: ThemePreference = "dark";
  try {
    const settings = await getSettings();
    if (settings.theme === "light" || settings.theme === "dark" || settings.theme === "system") {
      initialTheme = settings.theme;
    }
  } catch {
    // fall back to dark if settings can't be loaded (e.g. transient API error)
  }

  return (
    <ThemeProvider initialTheme={initialTheme}>
    <ToastProvider>
      <div className="relative flex min-h-screen w-full app-shell-bg text-primary">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(0,255,180,0.12),transparent_45%),radial-gradient(circle_at_90%_0%,rgba(124,58,237,0.14),transparent_40%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar user={user} accessToken={accessToken} />

          <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
    </ThemeProvider>
  );
}
