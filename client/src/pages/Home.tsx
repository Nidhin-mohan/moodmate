import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { MoodDot, MoodFace } from "@/components/mood/MoodFace";
import { MOODS } from "@/lib/moods";

const PREVIEW_WEEK = ["Neutral", "Happy", null, "Sad", "Neutral", "Happy", null] as const;

/** A miniature of the real dashboard, built from the same components (decorative). */
function DashboardPreview() {
  return (
    <div aria-hidden className="pointer-events-none select-none rounded-[28px] border border-border bg-card p-4 shadow-xl sm:p-5">
      <div className="rounded-3xl bg-hero p-4 sm:p-5">
        <p className="text-xs text-muted-foreground">Good evening</p>
        <p className="mt-1 font-serif text-xl font-medium text-foreground">How are you feeling right now?</p>
        <div className="mt-4 grid grid-cols-6 gap-1.5">
          {MOODS.map((m) => (
            <div key={m} className="flex flex-col items-center gap-1 rounded-xl bg-card/70 py-2 text-[10px] text-foreground">
              <MoodFace mood={m} size={28} decorative />
              {m}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 font-serif text-[15px] text-foreground">You've checked in 5 times this week. Mostly bright days.</p>
      <div className="mt-3 flex justify-between px-1">
        {PREVIEW_WEEK.map((m, i) =>
          m ? (
            <MoodDot key={i} mood={m} className="h-6 w-6" />
          ) : (
            <span key={i} className="h-6 w-6 rounded-full border-2 border-dashed border-border" />
          )
        )}
      </div>
    </div>
  );
}

const SECTIONS = [
  {
    title: "Check in with one tap",
    body: "Pick the face that fits. That's a whole check-in. Add more only when you feel like it.",
    art: (
      <div className="flex gap-1.5">
        {(["Happy", "Neutral", "Sad"] as const).map((m) => (
          <MoodFace key={m} mood={m} size={36} decorative />
        ))}
      </div>
    ),
  },
  {
    title: "See your patterns, gently",
    body: "A short story of your week, and calm charts when you're curious. Never a wall of numbers.",
    art: (
      <div className="flex gap-1.5">
        {(["Neutral", "Happy", "Sad", "Happy"] as const).map((m, i) => (
          <MoodDot key={i} mood={m} className="h-7 w-7" />
        ))}
      </div>
    ),
  },
  {
    title: "Support when you need it",
    body: "Breathing and grounding exercises for hard moments, and a quiet path to talk to someone.",
    art: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden className="text-primary">
        <path d="M20 34c-8-5-13-10-13-16a7 7 0 0 1 13-3.5A7 7 0 0 1 33 18c0 6-5 11-13 16z" fill="hsl(var(--soft))" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const Home = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <header className="mx-auto flex h-14 max-w-[1040px] items-center justify-between px-4 md:h-16 md:px-8">
        <span className="font-serif text-xl font-semibold text-foreground">MoodMate</span>
        <Link to={isLoggedIn ? "/dashboard" : "/login"} className="flex min-h-[44px] items-center text-[15px] font-medium text-foreground hover:text-primary">
          {isLoggedIn ? "Your dashboard" : "Log in"}
        </Link>
      </header>

      <main>
        <section className="bg-hero">
          <div className="mx-auto grid max-w-[1040px] items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.1fr_1fr] md:px-8 md:pb-24 md:pt-16">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <h1 className="text-balance font-serif text-[40px] font-medium leading-[1.08] text-foreground sm:text-[54px]">
                A gentle place to notice how you feel.
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
                MoodMate is a small daily journal for your moods. One tap on a hard day, a little more on a good one.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to={isLoggedIn ? "/dashboard" : "/signup"}
                  className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {isLoggedIn ? "Go to your dashboard" : "Start journaling"}
                </Link>
                <Link to="/tools" className="inline-flex min-h-[44px] items-center text-[15px] font-medium text-foreground hover:text-primary">
                  Try a calming exercise →
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <DashboardPreview />
            </motion.div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1040px] gap-10 px-4 py-16 md:grid-cols-3 md:px-8 md:py-20">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <div className="flex h-12 items-center">{s.art}</div>
              <h2 className="mt-4 font-serif text-xl text-foreground">{s.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
        MoodMate is a self-reflection tool, not a substitute for professional care.{" "}
        <Link to="/tools#support" className="underline underline-offset-2 hover:text-foreground">
          Need support?
        </Link>
      </footer>
    </div>
  );
};

export default Home;
