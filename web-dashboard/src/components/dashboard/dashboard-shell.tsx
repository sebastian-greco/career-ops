"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
}

const navItems = [
  { href: "/pipeline", label: "Pipeline" },
  { href: "/progress", label: "Progress" },
];

export function DashboardShell({ children }: DashboardShellProps) {
  const currentPath = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
              Career-Ops
            </p>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Web Dashboard</h1>
          </div>
          <nav className="flex items-center gap-1 rounded-full border border-border/60 bg-accent/55 p-1 shadow-sm shadow-primary/5">
            {navItems.map((item) => {
              const active = currentPath?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-out",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/25"
                      : "text-accent-foreground/80 hover:bg-background/75 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
