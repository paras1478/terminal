"use server";

import { redirect } from "next/navigation";
import { ApiError, loginUser, registerUser } from "@/lib/api/auth";
import { loginSchema, registerSchema } from "@/lib/schemas/auth";
import { createSession, destroySession } from "@/lib/auth/session";
import type { AuthFormState } from "@/lib/auth/form-state";

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });

  if (!parsed.success) {
    return {
      error: null,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const auth = await registerUser(parsed.data);
    await createSession(auth);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message, fieldErrors: {} };
    }
    return { error: "Unable to register right now.", fieldErrors: {} };
  }

  redirect("/dashboard");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: null,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const auth = await loginUser(parsed.data);
    await createSession(auth);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message, fieldErrors: {} };
    }
    return { error: "Unable to log in right now.", fieldErrors: {} };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/**
 * Clears the httpOnly session cookies without redirecting. Cookies can only
 * be written from server code (Server Actions, Route Handlers, Middleware —
 * see lib/auth/session.ts), so the client-side auth poller (AuthPoller)
 * calls this plain server action when GET /auth/me comes back 401, then
 * performs the actual navigation itself via useRouter — keeping the
 * "redirect must be called outside try/catch" navigation logic entirely in
 * one place (the client) rather than split across a server action's own
 * control flow.
 */
export async function clearSessionAction(): Promise<void> {
  await destroySession();
}
