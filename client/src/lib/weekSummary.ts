import { isLowMood, resolveMood } from "./moods";

export interface WeekDay {
  date: Date;
  /** Narrow weekday label: M T W T F S S */
  label: string;
  /** Latest mood logged that day, or null when there was no check-in. */
  mood: string | null;
  isToday: boolean;
}

export interface WeekSummary {
  days: WeekDay[];
  count: number;
  sentence: string;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function toneSentence(moods: string[]): string {
  const n = moods.length;
  const low = moods.filter(isLowMood).length;
  const bright = moods.filter((m) => ["Happy", "Excited"].includes(resolveMood(m).key)).length;
  const steady = n - low - bright;

  if (low / n >= 0.5) return "It's been a heavier week. Be gentle with yourself.";
  if (bright / n >= 0.6) return "Mostly bright days.";
  if (steady / n >= 0.6) return "Mostly steady.";
  return "A mix of moods, and that's okay.";
}

/**
 * The dashboard's story of the week: the 7 days ending today (oldest first)
 * with the latest mood per day, the number of check-ins, and one warm sentence.
 */
export function weekSummary(logs: { mood: string; date: string }[], today: Date = new Date()): WeekSummary {
  const end = startOfDay(today);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  const endExclusive = new Date(end);
  endExclusive.setDate(end.getDate() + 1);

  const inWindow = logs
    .map((l) => ({ mood: l.mood, at: new Date(l.date) }))
    .filter((l) => l.at >= start && l.at < endExclusive);

  const latestByDay = new Map<string, { mood: string; at: Date }>();
  for (const l of inWindow) {
    const key = dayKey(l.at);
    const prev = latestByDay.get(key);
    if (!prev || l.at > prev.at) latestByDay.set(key, l);
  }

  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return {
      date,
      label: date.toLocaleDateString("en-US", { weekday: "narrow" }),
      mood: latestByDay.get(dayKey(date))?.mood ?? null,
      isToday: i === 6,
    };
  });

  const count = inWindow.length;
  const sentence =
    count === 0
      ? "No check-ins yet this week. Whenever you're ready, one tap is enough."
      : `You've checked in ${count === 1 ? "once" : `${count} times`} this week. ${toneSentence(inWindow.map((l) => l.mood))}`;

  return { days, count, sentence };
}
