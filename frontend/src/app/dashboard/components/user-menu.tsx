"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/lib/auth/actions";
import type { User } from "@/lib/schemas/auth";

export function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const initials = (user.firstName?.[0] ?? user.email[0]).toUpperCase();
  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user.email;
  const roleLabel = user.role === "ADMIN" ? "Administrator" : "Developer";

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={menuRef} className="relative flex items-center border-l border-default pl-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-lg px-1.5 py-1 transition hover:panel-bg-strong active:panel-bg-hover"
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-secondary">{displayName}</p>
          <p className="text-xs text-faint">{roleLabel}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 font-mono text-sm font-semibold text-emerald-300">
          {initials}
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-default surface-bg shadow-2xl backdrop-blur-xl"
        >
          <div className="border-b border-default px-4 py-3">
            <p className="truncate text-sm font-medium text-secondary">{displayName}</p>
            <p className="truncate text-xs text-faint">{user.email}</p>
          </div>

          <div className="p-1.5">
            <Link
              href="/dashboard/profile"
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-tertiary transition hover:panel-bg-strong hover:text-primary"
            >
              Profile
            </Link>
            <Link
              href="/dashboard/settings"
              role="menuitem"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-tertiary transition hover:panel-bg-strong hover:text-primary"
            >
              Settings
            </Link>
          </div>

          <div className="border-t border-default p-1.5">
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-400/10"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
