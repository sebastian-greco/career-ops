"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

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
    <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()} title={command}>
      {copied ? "Copied" : label}
    </Button>
  );
}
