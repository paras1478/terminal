import { redirect } from "next/navigation";
import { completeOAuthLoginAction } from "@/lib/auth/actions";

/**
 * Landing point for the backend's OAuth redirect
 * (backend/src/auth/auth.controller.ts's googleCallback, which sends the
 * browser here as /auth/callback?code=...). Exchanges the one-time code for
 * a real session and forwards to the dashboard — this page never renders
 * visible content, it always redirects.
 */
export default async function OAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (!code) {
    redirect("/login?error=oauth_failed");
  }

  await completeOAuthLoginAction(code);
}
