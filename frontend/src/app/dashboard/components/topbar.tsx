import type { User } from "@/lib/schemas/auth";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";

export function Topbar({ user, accessToken }: { user: User; accessToken: string }) {
  return (
    <header className="relative z-40 flex h-16 items-center gap-4 border-b border-default app-shell-bg/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex-1">
        <div className="relative max-w-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
          >
            <path
              d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm9 2-4.35-4.35"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search commands, sessions, tasks…"
            className="w-full rounded-lg border border-default panel-bg py-2 pl-9 pr-3 text-sm text-secondary placeholder:text-faint outline-none transition focus:border-emerald-400/40 focus:panel-bg-strong"
          />
        </div>
      </div>

      <NotificationBell accessToken={accessToken} />

      <UserMenu user={user} />
    </header>
  );
}
