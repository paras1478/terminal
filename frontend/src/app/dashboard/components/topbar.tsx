import type { User } from "@/lib/schemas/auth";
import { UserMenu } from "./user-menu";

export function Topbar({ user }: { user: User }) {
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

      <button
        type="button"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-default panel-bg text-muted transition hover:text-secondary"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
          <path d="M6 9a6 6 0 1 1 12 0c0 3 1 4.5 1.5 5.5H4.5C5 13.5 6 12 6 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-red-400 ring-2 ring-[#05060a]" />
      </button>

      <UserMenu user={user} />
    </header>
  );
}
