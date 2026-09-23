"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", icon: "grid", href: "/dashboard/overview" },
  { label: "Sessions", icon: "terminal", href: "/dashboard/sessions" },
  { label: "Tasks", icon: "check", href: "/dashboard/tasks" },
  { label: "Workspaces", icon: "folder", href: "/dashboard/workspaces" },
  { label: "Automations", icon: "bolt", href: "/dashboard/automations" },
  { label: "Logs", icon: "log", href: "/dashboard/logs" },
  { label: "Integrations", icon: "plug", href: "/dashboard/integrations" },
  { label: "Settings", icon: "gear", href: "/dashboard/settings" },
];

function NavIcon({ name }: { name: string }) {
  const cls = "h-4.5 w-4.5";
  switch (name) {
    case "grid":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "terminal":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M4 5h16v14H4V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M7 10l3 2.5L7 15M13 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M4 12h4l2 3 4-8 2 5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "folder":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M3 6h6l2 2h10v11H3V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "log":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M5 4h14v16H5V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "plug":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0V8ZM12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "gear":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={cls}>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3H9.8l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-default panel-bg-soft backdrop-blur-xl lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-default px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 font-mono text-sm text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
          &gt;_
        </div>
        <span className="font-mono text-sm font-semibold tracking-tight text-primary">
          termina<span className="text-emerald-400">.ai</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href) ?? false;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-emerald-400/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.12)_inset] ring-1 ring-emerald-400/20"
                  : "text-muted hover:bg-white/5 hover:text-secondary"
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-default p-4">
        <div className="rounded-xl border border-default bg-gradient-to-br from-emerald-500/10 to-violet-500/10 p-4">
          <p className="text-xs font-semibold text-secondary">Agent runtime</p>
          <p className="mt-1 text-xs text-muted">v2.4.1 · connected</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs text-emerald-300">All systems operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
