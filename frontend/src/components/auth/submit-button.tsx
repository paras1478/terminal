"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingText: string;
}

export function SubmitButton({ children, pendingText }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover disabled:cursor-not-allowed disabled:bg-[color:var(--border-default)] disabled:text-muted disabled:opacity-100"
    >
      {pending ? pendingText : children}
    </button>
  );
}
