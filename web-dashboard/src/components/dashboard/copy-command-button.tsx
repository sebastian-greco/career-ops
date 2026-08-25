"use client";

import { useEffect, useRef, useState } from "react";

interface CopyCommandButtonProps {
  command: string;
  label: string;
}

export function CopyCommandButton({ command, label }: CopyCommandButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <details className="group relative">
      <summary className="flex min-h-10 cursor-pointer list-none items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent [&::-webkit-details-marker]:hidden">
        {label} command
      </summary>
      <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
        <code className="block select-all break-all rounded-lg bg-muted p-2 text-xs">{command}</code>
        <button type="button" onClick={() => void handleCopy()} className="mt-2 min-h-10 w-full rounded-lg bg-secondary px-3 text-xs font-bold text-secondary-foreground">
          {copied ? "Copied" : "Copy command"}
        </button>
      </div>
    </details>
  );
}
