"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/auth/actions";
import { initialAuthFormState } from "@/lib/auth/form-state";
import { SubmitButton } from "@/components/auth/submit-button";
import { FieldError } from "@/components/auth/field-error";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export function RegisterForm() {
  const [state, formAction] = useActionState(
    registerAction,
    initialAuthFormState,
  );

  return (
    <div className="space-y-4">
      <OAuthButtons />

      <div className="flex items-center gap-3 text-xs text-faint">
        <div className="h-px flex-1 bg-[color:var(--border-default)]" />
        or sign up with email
        <div className="h-px flex-1 bg-[color:var(--border-default)]" />
      </div>

      <form action={formAction} noValidate className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-error/30 bg-error-subtle px-3 py-2 text-sm text-error"
        >
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-secondary"
          >
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            className="mt-1 w-full rounded-md border border-default panel-bg px-3 py-2 text-sm text-primary focus:border-accent-hover focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-secondary"
          >
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            className="mt-1 w-full rounded-md border border-default panel-bg px-3 py-2 text-sm text-primary focus:border-accent-hover focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-secondary"
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
          className="mt-1 w-full rounded-md border border-default panel-bg px-3 py-2 text-sm text-primary focus:border-accent-hover focus:outline-none"
        />
        <FieldError id="email-error" messages={state.fieldErrors.email} />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-secondary"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          aria-describedby={
            state.fieldErrors.password ? "password-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.password)}
          className="mt-1 w-full rounded-md border border-default panel-bg px-3 py-2 text-sm text-primary focus:border-accent-hover focus:outline-none"
        />
        <FieldError id="password-error" messages={state.fieldErrors.password} />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-secondary"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          aria-describedby={
            state.fieldErrors.confirmPassword
              ? "confirmPassword-error"
              : undefined
          }
          aria-invalid={Boolean(state.fieldErrors.confirmPassword)}
          className="mt-1 w-full rounded-md border border-default panel-bg px-3 py-2 text-sm text-primary focus:border-accent-hover focus:outline-none"
        />
        <FieldError
          id="confirmPassword-error"
          messages={state.fieldErrors.confirmPassword}
        />
      </div>

      <SubmitButton pendingText="Creating account…">
        Create account
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline hover:text-accent-hover">
          Log in
        </Link>
      </p>
      </form>
    </div>
  );
}
