import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-primary">
          Log in to AI Terminal
        </h1>
        {error === "oauth_failed" && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-error/30 bg-error-subtle px-3 py-2 text-sm text-error"
          >
            Sign-in with that provider failed. Please try again.
          </p>
        )}
        {error === "account_deleted" && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-error/30 bg-error-subtle px-3 py-2 text-sm text-error"
          >
            This account no longer exists. Please register again to create a new account.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
