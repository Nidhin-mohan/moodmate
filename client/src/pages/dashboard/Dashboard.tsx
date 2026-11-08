import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { createMoodLog, getAllMoodLogs, type MoodLog } from "@/services/moodLogService";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { MoodDot } from "@/components/mood/MoodFace";
import { EntryCard } from "@/components/mood/EntryCard";
import { resolveMood, type MoodName } from "@/lib/moods";
import { weekSummary } from "@/lib/weekSummary";
import { showToast } from "@/utils/toast";

const greeting = (now = new Date()) => {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllMoodLogs({ page: 1, limit: 50 })
      .then((res) => setLogs(res.data))
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, []);

  // The hero IS the quick log: save, then continue on the log screen.
  const quickLog = async (mood: MoodName) => {
    setSaving(true);
    try {
      const res = await createMoodLog({ mood });
      navigate("/mood-tracking", { state: { saved: res.data } });
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "Couldn't save. Please try again.");
      setSaving(false);
    }
  };

  const summary = weekSummary(logs.map((l) => ({ mood: l.mood, date: l.date ?? l.createdAt })));
  const last = logs[0];
  const firstName = user?.name?.split(" ")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-[720px] px-4 pb-24 pt-5 sm:px-8 sm:pt-10"
    >
      <section className="rounded-[28px] bg-hero p-5 sm:p-9">
        <p className="text-[15px] text-muted-foreground">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="mt-1 font-serif text-[28px] font-medium leading-[1.15] text-foreground sm:text-[40px] sm:leading-[1.1]">
          How are you feeling right now?
        </h1>
        <MoodPicker onPick={quickLog} disabled={saving} className="mt-6" />
        <p className="mt-4 text-[13px] text-muted-foreground">One tap saves it. You can add more after.</p>
      </section>

      {loading ? (
        <div className="mt-10 space-y-3" aria-busy="true" aria-label="Loading your week">
          <div className="h-6 w-3/4 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-full animate-pulse rounded-full bg-muted" />
        </div>
      ) : loadFailed ? (
        <p className="mt-10 text-muted-foreground">
          We couldn't load your week just now. Your check-ins are safe. Try again in a moment.
        </p>
      ) : (
        <>
          <section className="mt-8 sm:mt-12" aria-label="Your week">
            <p className="font-serif text-[19px] leading-snug text-foreground sm:text-[22px]">{summary.sentence}</p>
            <ol className="mt-5 flex justify-between gap-1">
              {summary.days.map((d) => (
                <li key={d.date.toISOString()} className="flex flex-1 flex-col items-center gap-2">
                  {d.mood ? (
                    <span title={resolveMood(d.mood).label}>
                      <MoodDot mood={d.mood} className="h-9 w-9" />
                      <span className="sr-only">
                        {d.date.toLocaleDateString("en-US", { weekday: "long" })}: {resolveMood(d.mood).label}
                      </span>
                    </span>
                  ) : (
                    <span className="h-9 w-9 rounded-full border-2 border-dashed border-border">
                      <span className="sr-only">
                        {d.date.toLocaleDateString("en-US", { weekday: "long" })}: no check-in
                      </span>
                    </span>
                  )}
                  <span
                    aria-hidden
                    className={`text-xs ${d.isToday ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {d.label}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-8 sm:mt-12">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Your last entry</h2>
            <div className="mt-3">
              {last ? (
                <EntryCard log={last} />
              ) : (
                <div className="rounded-3xl border border-dashed border-border p-6 text-center">
                  <p className="font-serif text-lg text-foreground">Your journal starts with your first check-in.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Tap a face above whenever you're ready.</p>
                </div>
              )}
            </div>
            {last && (
              <Link
                to="/mood-history?tab=trends"
                className="mt-4 inline-flex min-h-[44px] items-center text-[15px] font-medium text-primary"
              >
                See trends →
              </Link>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
};

export default Dashboard;
