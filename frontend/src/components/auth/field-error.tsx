interface FieldErrorProps {
  id: string;
  messages?: string[];
}

export function FieldError({ id, messages }: FieldErrorProps) {
  if (!messages || messages.length === 0) return null;

  return (
    <p id={id} role="alert" className="mt-1 text-sm text-error">
      {messages[0]}
    </p>
  );
}
