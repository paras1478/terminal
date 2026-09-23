"use client";

/**
 * Fires a client-side notification for a session outcome, respecting the
 * user's own notifyOnCompletion/notifyOnFailure settings (backend also
 * checks these before sending email — this covers the in-app/OS channel).
 * Prefers the native Electron notification when running inside the desktop
 * shell (see electron/src/preload.js), falling back to the Web Notification
 * API, and finally to nothing (the toast shown by the caller is the last
 * resort UI signal either way).
 */
export async function showSessionNotification(title: string, body: string): Promise<void> {
  if (typeof window === "undefined") return;

  if (window.desktopBridge?.isElectron) {
    try {
      await window.desktopBridge.showNotification(title, body);
      return;
    } catch {
      // fall through to Web Notification API
    }
  }

  if (typeof Notification === "undefined") return;

  try {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification(title, { body });
      }
    }
  } catch {
    // notifications unsupported/blocked; the in-app toast already covers this
  }
}
