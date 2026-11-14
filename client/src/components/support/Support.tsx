import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { SAMPLE_HELPLINES, toolsGroupHref } from "@/lib/supportResources";
import { toolsGroupFor } from "@/lib/moods";

/** Light nudge after a low-mood quick log. Never blocks; can be dismissed. */
export function SupportNudge({ mood, onDismiss }: { mood: string; onDismiss: () => void }) {
  return (
    <div role="note" className="flex items-start gap-3 rounded-2xl bg-soft p-4 text-left text-soft-foreground">
      <p className="flex-1 text-[15px]">
        Rough moment? A 1-minute breather can help.{" "}
        <Link to={toolsGroupHref(toolsGroupFor(mood))} className="font-medium underline underline-offset-2">
          Try one
        </Link>
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-background/30"
      >
        <X size={18} />
      </button>
    </div>
  );
}

/** Placeholder helplines, always labelled as sample data. */
export function HelplineCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-foreground">Talk to someone</p>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          Sample data
        </span>
      </div>
      <ul className="mt-3 space-y-3 text-[15px]">
        {SAMPLE_HELPLINES.map((h) => (
          <li key={h.name} className="flex flex-wrap items-baseline justify-between gap-x-4">
            <span className="text-foreground">{h.name}</span>
            <span className="text-muted-foreground">
              {h.contact} · {h.note}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        These are placeholders, not real services. If you're in danger, contact your local emergency number.
      </p>
    </div>
  );
}

/** Full support content after a strong low mood: grounding + helplines. */
export function SupportPanel({ mood }: { mood: string }) {
  return (
    <div className="space-y-3">
      <Link
        to={toolsGroupHref(toolsGroupFor(mood) ?? "scattered")}
        className="flex min-h-[56px] items-center justify-between rounded-2xl bg-soft px-5 text-base font-medium text-soft-foreground"
      >
        Try a short grounding exercise <span aria-hidden>→</span>
      </Link>
      <HelplineCard />
    </div>
  );
}
