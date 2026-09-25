"use client";

import { useState } from "react";
import { NewSessionModal } from "./new-session-modal";

export function NewSessionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-subtle px-4 py-2 text-sm font-medium text-accent-hover transition hover:bg-[rgb(59_130_246_/_0.2)]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        New Session
      </button>

      {isOpen && <NewSessionModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
