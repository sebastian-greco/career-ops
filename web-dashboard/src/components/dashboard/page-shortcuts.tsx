"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PageShortcutsProps {
  backHref: string;
}

const SCROLL_STEP = 80;

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
    : false;
}

export function PageShortcuts({ backHref }: PageShortcutsProps) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target) || event.metaKey || event.altKey) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        router.push(backHref);
        return;
      }

      if (event.key === "j") {
        event.preventDefault();
        window.scrollBy({ top: SCROLL_STEP, behavior: "smooth" });
        return;
      }

      if (event.key === "k") {
        event.preventDefault();
        window.scrollBy({ top: -SCROLL_STEP, behavior: "smooth" });
        return;
      }

      if (event.key === "PageDown" || (event.ctrlKey && event.key.toLowerCase() === "d")) {
        event.preventDefault();
        window.scrollBy({ top: window.innerHeight / 2, behavior: "smooth" });
        return;
      }

      if (event.key === "PageUp" || (event.ctrlKey && event.key.toLowerCase() === "u")) {
        event.preventDefault();
        window.scrollBy({ top: -window.innerHeight / 2, behavior: "smooth" });
        return;
      }

      if (event.key === "g" && !event.shiftKey) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (event.key.toLowerCase() === "g" && event.shiftKey) {
        event.preventDefault();
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [backHref, router]);

  return (
    <div className="rounded-xl border border-border bg-card/80 px-4 py-3 text-xs text-muted-foreground shadow-sm">
      Shortcuts: <span className="font-medium text-foreground">j/k</span> scroll, <span className="font-medium text-foreground">PgUp/PgDn</span> page, <span className="font-medium text-foreground">g/G</span> top/end, <span className="font-medium text-foreground">Esc</span> back
    </div>
  );
}
