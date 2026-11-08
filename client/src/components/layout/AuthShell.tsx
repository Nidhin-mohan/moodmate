import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/** Calm frame for Login and Sign up: brand link, soft gradient, one card. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-hero px-4" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <header className="mx-auto flex h-14 w-full max-w-md items-center md:h-16">
        <Link to="/" className="font-serif text-xl font-semibold text-foreground">
          MoodMate
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center pb-12 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-9">
          <h1 className="font-serif text-[28px] font-medium leading-tight text-foreground">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  );
}
