import type { MoodLog } from "@/services/moodLogService";
import { resolveMood } from "@/lib/moods";
import { recordedDetails } from "@/lib/recordedDetails";
import { formatActivityDate } from "@/lib/formatActivityDate";
import { MoodFace } from "./MoodFace";

const SOCIAL_LABEL = { isolated: "On my own", neutral: "Some contact", connected: "Connected" } as const;
const TRIGGER_LABEL = {
  work: "Work",
  relationships: "Relationships",
  health: "Health",
  finances: "Money",
  environment: "Surroundings",
  random: "No clear reason",
} as const;

interface EntryCardProps {
  log: MoodLog;
  /** Show every recorded detail (journal entry opened) instead of the short view. */
  full?: boolean;
  /** Override the default "Today, 9:40 PM" line (e.g. time only, inside a day group). */
  when?: string;
}

/** One entry, showing only what was recorded — a mood-only log looks complete. */
export function EntryCard({ log, full = false, when }: EntryCardProps) {
  const tags = [...(log.tagsPeople ?? []), ...(log.tagsPlaces ?? []), ...(log.tagsEvents ?? [])];
  const details = recordedDetails(log);
  const label = resolveMood(log.mood).label;
  return (
    <article className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <MoodFace mood={log.mood} size={40} decorative />
        <div>
          <p className="font-medium text-foreground">
            {label}
            {log.specificEmotion ? <span className="text-muted-foreground"> · {log.specificEmotion}</span> : null}
          </p>
          <p className="text-[13px] text-muted-foreground">{when ?? formatActivityDate(log.date ?? log.createdAt)}</p>
        </div>
      </div>
      {log.notes && <p className="mt-4 text-[15px] leading-relaxed text-foreground">{log.notes}</p>}
      {full && log.reflections && (
        <p className="mt-3 border-l-2 border-primary/40 pl-3 font-serif text-[15px] italic leading-relaxed text-foreground">
          {log.reflections}
        </p>
      )}
      {details.length > 0 && <p className="mt-3 text-[13px] text-muted-foreground">{details.join(" · ")}</p>}
      {full && (log.socialQuality || log.moodTriggerCategory) && (
        <p className="mt-1 text-[13px] text-muted-foreground">
          {[
            log.socialQuality && SOCIAL_LABEL[log.socialQuality],
            log.moodTriggerCategory && `Behind it: ${TRIGGER_LABEL[log.moodTriggerCategory]}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t, i) => (
            <span key={`${t}-${i}`} className="rounded-full bg-soft px-3 py-1 text-[13px] text-soft-foreground">
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
