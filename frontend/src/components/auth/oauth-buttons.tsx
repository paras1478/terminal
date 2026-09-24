import { API_BASE_URL, APP_URL } from "@/lib/env";

/**
 * Full-page navigation to the backend's OAuth entrypoint
 * (backend/src/auth/auth.controller.ts's googleLogin, which redirects to
 * Google). This must be a plain link, not fetch/XHR: the whole point is a
 * top-level browser redirect through Google's consent screen and back to
 * /auth/callback.
 *
 * Passes this app's own known origin (APP_URL, from NEXT_PUBLIC_APP_URL) as
 * ?returnTo=, which the backend threads through Google's OAuth `state`
 * parameter and validates against an allowlist before using it as the
 * final redirect target (see GoogleAuthGuard / AuthController). This lets
 * one deployed backend correctly return local/Electron dev clients to
 * their own origin instead of always redirecting to the production
 * frontend — without needing a server-only secret or CORS_ORIGIN
 * flip-flopping. Omitted when APP_URL isn't set (e.g. in production, where
 * CORS_ORIGIN alone is already the right target).
 */
export function OAuthButtons() {
  const googleLoginUrl = APP_URL
    ? `${API_BASE_URL}/auth/google?returnTo=${encodeURIComponent(APP_URL)}`
    : `${API_BASE_URL}/auth/google`;

  return (
    <div className="space-y-3">
      <a
        href={googleLoginUrl}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.66Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.3v3.1A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.31 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.3a12 12 0 0 0 0 10.8l4.01-3.1Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.3 6.6l4.01 3.1C6.25 6.86 8.89 4.75 12 4.75Z"
          />
        </svg>
        Continue with Google
      </a>
    </div>
  );
}
