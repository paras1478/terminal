"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppNotification } from "@/lib/api/dashboard";
import {
  getNotificationsClient,
  markAllNotificationsReadClient,
  markNotificationReadClient,
} from "@/lib/api/settings-client";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function NotificationBell({ accessToken }: { accessToken: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getNotificationsClient(accessToken);
      setNotifications(result.items);
      setUnreadCount(result.unreadCount);
    } catch {
      setError("Unable to load notifications right now.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Poll for unread count so the badge stays fresh even when the dropdown is closed,
  // and refresh immediately when a session completion/failure fires elsewhere in the
  // app (see agent-panel.tsx's "notifications:refresh" dispatch).
  useEffect(() => {
    const timeoutId = setTimeout(() => void load(), 0);
    const interval = setInterval(() => void load(), 30_000);
    const handleRefresh = () => void load();
    window.addEventListener("notifications:refresh", handleRefresh);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
      window.removeEventListener("notifications:refresh", handleRefresh);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      await load();
    }
  }

  async function handleNotificationClick(notification: AppNotification) {
    if (notification.read) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationReadClient(accessToken, notification.id);
    } catch {
      // revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: false } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    const previous = notifications;
    const previousCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsReadClient(accessToken);
    } catch {
      setNotifications(previous);
      setUnreadCount(previousCount);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-default panel-bg text-muted transition hover:text-secondary"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
          <path
            d="M6 9a6 6 0 1 1 12 0c0 3 1 4.5 1.5 5.5H4.5C5 13.5 6 12 6 9Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-[1.125rem] items-center justify-center rounded-full bg-error px-1 text-[10px] font-semibold leading-none text-primary ring-2 ring-[var(--app-bg)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-notification-dropdown absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-default surface-bg shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-default px-4 py-3">
            <h3 className="text-sm font-semibold text-primary">Notifications</h3>
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={unreadCount === 0}
              className="text-xs font-medium text-accent-hover transition hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-faint">Loading…</p>
            )}
            {error && <p className="px-4 py-6 text-center text-sm text-error">{error}</p>}
            {!loading && !error && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-faint">You&apos;re all caught up.</p>
            )}
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleNotificationClick(notification)}
                role="menuitem"
                className={`flex w-full flex-col gap-0.5 border-b border-subtle px-4 py-3 text-left transition panel-bg-hover last:border-b-0 ${
                  notification.read ? "" : "panel-bg-soft"
                }`}
              >
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      notification.read ? "text-tertiary" : "text-primary"
                    }`}
                  >
                    {notification.title}
                  </span>
                </div>
                <p className="text-xs text-muted">{notification.message}</p>
                <span className="text-[11px] text-faint">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
