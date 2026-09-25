import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { OAuthRegisterConfirm } from "@/components/auth/oauth-register-confirm";

export const metadata: Metadata = {
  title: "Create an account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ oauthPending?: string; oauthEmail?: string }>;
}) {
  const { oauthPending, oauthEmail } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-primary">
          Create an account
        </h1>
        {oauthPending && oauthEmail ? (
          <OAuthRegisterConfirm token={oauthPending} email={oauthEmail} />
        ) : (
          <RegisterForm />
        )}
      </div>
    </main>
  );
}
