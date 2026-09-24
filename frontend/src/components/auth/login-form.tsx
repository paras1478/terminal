"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";
import { initialAuthFormState } from "@/lib/auth/form-state";
import { SubmitButton } from "@/components/auth/submit-button";
import { FieldError } from "@/components/auth/field-error";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export function LoginForm() {
  const [state, formAction] = useActionState(
    loginAction,
    initialAuthFormState,
  );

  return (
    <div className="space-y-4">
      <OAuthButtons />

      <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        or continue with email
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      <form action={formAction} noValidate className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-describedby={state.fieldErrors.email ? "email-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors.email)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        />
        <FieldError id="email-error" messages={state.fieldErrors.email} />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-describedby={
            state.fieldErrors.password ? "password-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.password)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        />
        <FieldError id="password-error" messages={state.fieldErrors.password} />
      </div>

      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-slate-900 underline dark:text-white"
        >
          Create one
        </Link>
      </p>
      </form>
    </div>
  );
}
