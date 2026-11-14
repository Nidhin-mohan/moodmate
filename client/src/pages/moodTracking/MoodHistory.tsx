import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAllMoodLogs, getMoodStats, type MoodLog, type MoodLogFilters, type MoodStatsResponse } from "@/services/moodLogService";
import { MoodFace } from "@/components/mood/MoodFace";
import { EntryCard } from "@/components/mood/EntryCard";
import { ChoiceChips } from "@/components/mood/ScalePicker";
import { MOODS, resolveMood } from "@/lib/moods";
import { rangeStart, type JournalRange } from "@/lib/journalRange";
import { cn } from "@/lib/utils";

type Tab = "journal" | "trends";
type Range = JournalRange;

const LIMIT = 10;
const DAY_MS = 86_400_000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function dayHeading(date: Date, now = new Date()): string {
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}

function groupByDay(logs: MoodLog[]) {
  const groups: { key: string; heading: string; logs: MoodLog[] }[] = [];
  for (const log of logs) {
    const d = new Date(log.date ?? log.createdAt);
    const key = startOfDay(d).toISOString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.logs.push(log);
    else groups.push({ key, heading: dayHeading(d), logs: [log] });
  }
  return groups;
}

/* ───────────────────────── Journal ───────────────────────── */

function Journal() {
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [mood, setMood] = useState<string | undefined>();
  const [range, setRange] = useState<Range>("all");
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const params: MoodLogFilters = { page, limit: LIMIT };
    if (mood) params.mood = mood;
    const start = rangeStart(range);
    if (start) params.startDate = start.toISOString();
    setLoading(true);
    setFailed(false);
    getAllMoodLogs(params)
      .then((res) => {
        setLogs(res.data);
        setPages(Math.max(1, res.pages));
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [page, mood, range]);

  const groups = useMemo(() => groupByDay(logs), [logs]);
  const filtered = mood || range !== "all";

  return (
    <div>
      {/* Filter row: tap a face to see only that mood; tap again to clear. */}
      <div className="flex flex-wrap items-center gap-1" aria-label="Filter by mood">
        {MOODS.map((m) => {
          const on = mood === m;
          return (
            <button
              key={m}
              type="button"
              aria-label={`Show only ${m}`}
              aria-pressed={on}
              onClick={() => {
                setMood(on ? undefined : m);
                setPage(1);
              }}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition",
                on ? "bg-accent ring-2 ring-primary" : mood ? "opacity-50 hover:opacity-100" : "hover:bg-accent"
              )}
            >
              <MoodFace mood={m} size={32} decorative />
            </button>
          );
        })}
      </div>
      <div className="mt-3">
        <ChoiceChips<Range>
          label="Time range"
          options={[
            { value: "week", label: "This week" },
            { value: "month", label: "This month" },
            { value: "all", label: "All" },
          ]}
          value={range}
          onChange={(v) => {
            setRange(v ?? "all");
            setPage(1);
          }}
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading entries">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : failed ? (
          <p className="text-muted-foreground">We couldn't load your journal just now. Please try again in a moment.</p>
        ) : logs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center">
            <p className="font-serif text-lg text-foreground">
              {filtered ? "Nothing here for this filter." : "Your journal is waiting for its first entry."}
            </p>
            {!filtered && (
              <Link to="/mood-tracking" className="mt-3 inline-flex min-h-[44px] items-center font-medium text-primary">
                Check in now →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.key} aria-labelledby={`day-${g.key}`}>
                <h2 id={`day-${g.key}`} className="mb-3 font-serif text-lg text-foreground">
                  {g.heading}
                </h2>
                <ul className="space-y-3">
                  {g.logs.map((log) => {
                    const hasMore = Boolean(log.reflections || log.socialQuality || log.moodTriggerCategory);
                    const isOpen = open === log._id;
                    return (
                      <li key={log._id}>
                        <EntryCard
                          log={log}
                          full={isOpen}
                          when={new Date(log.date ?? log.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        />
                        {hasMore && (
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => setOpen(isOpen ? null : log._id)}
                            className="ml-5 mt-1 min-h-[44px] text-sm text-primary"
                          >
                            {isOpen ? "Show less" : "Show more"}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {!loading && !failed && pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pages">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-11 rounded-full border border-border px-5 text-sm text-foreground disabled:opacity-40"
            >
              ← Newer
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="h-11 rounded-full border border-border px-5 text-sm text-foreground disabled:opacity-40"
            >
              Older →
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Trends ───────────────────────── */

type Stats = MoodStatsResponse["data"];

function StatTile({ label, value, suffix }: { label: string; value: number | null; suffix: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      {value == null ? (
        <p className="mt-2 text-sm text-muted-foreground">Not enough data yet</p>
      ) : (
        <p className="mt-1 text-foreground">
          <span className="font-serif text-3xl">{value}</span>
          <span className="ml-1 text-sm text-muted-foreground">{suffix}</span>
        </p>
      )}
    </div>
  );
}

function Trends() {
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    getMoodStats(Number(days))
      .then((res) => setStats(res.data))
      .catch(() => setFailed(true));
  }, [days]);

  // Merge raw mood keys case-insensitively ("sad" + "Sad"), largest first.
  const breakdown = useMemo(() => {
    const merged = new Map<string, { label: string; mood: string; count: number }>();
    for (const [raw, count] of Object.entries(stats?.moodBreakdown ?? {})) {
      const info = resolveMood(raw);
      const key = info.label.toLowerCase();
      const prev = merged.get(key);
      if (prev) prev.count += count;
      else merged.set(key, { label: info.label, mood: raw, count });
    }
    return [...merged.values()].sort((a, b) => b.count - a.count);
  }, [stats]);
  const max = breakdown[0]?.count ?? 0;
  const total = breakdown.reduce((s, b) => s + b.count, 0);

  return (
    <div>
      <ChoiceChips<"7" | "30" | "90">
        label="Period"
        options={[
          { value: "7", label: "7 days" },
          { value: "30", label: "30 days" },
          { value: "90", label: "90 days" },
        ]}
        value={days}
        onChange={(v) => v && setDays(v)}
      />

      {failed ? (
        <p className="mt-8 text-muted-foreground">We couldn't load your trends just now. Please try again in a moment.</p>
      ) : !stats ? (
        <div className="mt-8 h-48 animate-pulse rounded-3xl bg-muted" aria-busy="true" aria-label="Loading trends" />
      ) : stats.totalLogs === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-serif text-lg text-foreground">No check-ins in this period yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Patterns appear after a few check-ins. There's no rush.</p>
        </div>
      ) : (
        <>
          <section className="mt-8 rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-serif text-lg text-foreground">How you've felt</h2>
            <p className="text-[13px] text-muted-foreground">
              {stats.totalLogs} check-in{stats.totalLogs === 1 ? "" : "s"} · {stats.period.toLowerCase()}
            </p>
            {/* One series (count per mood): single brand hue; identity comes from the face + label on each row. */}
            <ul aria-label="Mood breakdown" className="mt-5 space-y-3">
              {breakdown.map((b) => {
                const pct = total ? Math.round((b.count / total) * 100) : 0;
                return (
                  <li key={b.label} className="grid grid-cols-[2rem_6rem_1fr_auto] items-center gap-3" title={`${b.label}: ${b.count} (${pct}%)`}>
                    <MoodFace mood={b.mood} size={28} decorative />
                    <span className="truncate text-sm text-foreground">{b.label}</span>
                    <span className="h-3 rounded-full bg-muted" aria-hidden>
                      <span
                        className="block h-3 rounded-full bg-primary"
                        style={{ width: `${max ? Math.max(4, (b.count / max) * 100) : 0}%` }}
                      />
                    </span>
                    <span className="text-right text-sm tabular-nums text-muted-foreground">
                      {b.count} · {pct}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-6" aria-label="Averages">
            <p className="mb-3 text-[13px] text-muted-foreground">
              Averages use only the check-ins where you recorded that detail.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Intensity" value={stats.avgIntensity} suffix="/10" />
              <StatTile label="Energy" value={stats.avgEnergyLevel} suffix="/10" />
              <StatTile label="Sleep" value={stats.avgSleepHours} suffix="hours" />
              <StatTile label="Sleep quality" value={stats.avgSleepQuality} suffix="/5" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function MoodHistory() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "trends" ? "trends" : "journal";

  const selectTab = (t: Tab) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (t === "journal") n.delete("tab");
        else n.set("tab", t);
        return n;
      },
      { replace: true }
    );

  return (
    <div className={cn("mx-auto px-4 pb-24 pt-6 sm:px-8 sm:pt-10", tab === "trends" ? "max-w-[880px]" : "max-w-[720px]")}>
      <h1 className="font-serif text-[30px] font-medium text-foreground sm:text-[38px]">Your journal</h1>

      <div role="tablist" aria-label="Journal views" className="mt-5 inline-flex rounded-full bg-muted p-1">
        {(["journal", "trends"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            onClick={() => selectTab(t)}
            className={cn(
              "min-h-[44px] rounded-full px-5 text-sm font-medium transition-colors",
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "journal" ? "Journal" : "Trends"}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-8">
        {tab === "journal" ? <Journal /> : <Trends />}
      </div>
    </div>
  );
}
