import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MoodFace } from "@/components/mood/MoodFace";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { ChoiceChips, ScalePicker } from "@/components/mood/ScalePicker";
import { ChipInput } from "@/components/mood/ChipInput";
import { SupportNudge, SupportPanel } from "@/components/support/Support";
import { showToast } from "@/utils/toast";
import { resolveMood, type MoodName } from "@/lib/moods";
import { supportLevel } from "@/lib/support";
import { detailsPatch } from "@/lib/detailsPatch";
import { tagSuggestions } from "@/lib/tagSuggestions";
import {
  createMoodLog,
  getAllMoodLogs,
  updateMoodLog,
  type MoodLog,
  type MoodLogPatch,
  type MoodTriggerCategory,
  type SocialQuality,
} from "@/services/moodLogService";

const SUB_MOODS: Record<MoodName, string[]> = {
  Happy: ["Content", "Grateful", "Proud", "Relieved", "Optimistic"],
  Excited: ["Energetic", "Motivated", "Curious", "Hopeful"],
  Neutral: ["Calm", "Bored", "Tired", "Numb"],
  Sad: ["Lonely", "Disappointed", "Hurt", "Grieving"],
  Anxious: ["Stressed", "Overwhelmed", "Nervous", "Insecure"],
  Angry: ["Frustrated", "Irritated", "Resentful", "Jealous"],
};

const SOCIAL: { value: SocialQuality; label: string }[] = [
  { value: "isolated", label: "On my own" },
  { value: "neutral", label: "Some contact" },
  { value: "connected", label: "Connected" },
];

const TRIGGERS: { value: MoodTriggerCategory; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "relationships", label: "Relationships" },
  { value: "health", label: "Health" },
  { value: "finances", label: "Money" },
  { value: "environment", label: "Surroundings" },
  { value: "random", label: "No clear reason" },
];

/** The fields each detail step owns — "Skip" clears exactly these. */
const STEP_FIELDS: (keyof MoodLogPatch)[][] = [
  ["intensity", "specificEmotion"],
  ["energyLevel", "sleepHours", "sleepQuality", "exercise", "exerciseMinutes"],
  ["stressLevel", "anxietyLevel", "socialQuality", "moodTriggerCategory", "tagsPeople", "tagsPlaces", "tagsEvents"],
  ["notes", "reflections"],
];
const STEP_TITLES = ["How strong is this feeling?", "Energy & sleep", "What's going on?", "Anything else?"];

type Phase =
  | { name: "pick" }
  | { name: "saved" }
  | { name: "step"; index: number }
  | { name: "support" };

const fieldLabel = "mb-3 block text-sm font-medium text-foreground";
const headingClass = "font-serif text-[26px] font-medium leading-tight text-foreground sm:text-[32px]";

export default function MoodTrackingForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const arrived = (location.state as { saved?: MoodLog } | null)?.saved ?? null;

  const [saved, setSaved] = useState<MoodLog | null>(arrived);
  const [phase, setPhase] = useState<Phase>(arrived ? { name: "saved" } : { name: "pick" });
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<MoodLogPatch>({});
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [supportShown, setSupportShown] = useState(false);
  const [pastLogs, setPastLogs] = useState<MoodLog[]>([]);

  // During a step's exit animation its buttons are still on screen; a quick
  // second tap must not act on that stale step or its stale draft.
  const phaseRef = useRef(phase);
  const draftRef = useRef(draft);
  phaseRef.current = phase;
  draftRef.current = draft;
  const isCurrentStep = (index: number) =>
    phaseRef.current.name === "step" && phaseRef.current.index === index;

  const mood = saved?.mood ?? "";
  const moodInfo = resolveMood(mood);
  const set = <K extends keyof MoodLogPatch>(key: K, value: MoodLogPatch[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Past tags feed the chip suggestions; fetched once the details flow starts.
  const inDetails = phase.name === "step";
  useEffect(() => {
    if (!inDetails || pastLogs.length) return;
    getAllMoodLogs({ limit: 100 })
      .then((res) => setPastLogs(res.data))
      .catch(() => {
        /* suggestions are a nicety — the flow works without them */
      });
  }, [inDetails, pastLogs.length]);

  const suggestions = useMemo(
    () => ({
      people: tagSuggestions(pastLogs, "people", draft.tagsPeople),
      places: tagSuggestions(pastLogs, "places", draft.tagsPlaces),
      events: tagSuggestions(pastLogs, "events", draft.tagsEvents),
    }),
    [pastLogs, draft.tagsPeople, draft.tagsPlaces, draft.tagsEvents]
  );

  const quickLog = async (m: MoodName) => {
    setBusy(true);
    try {
      const res = await createMoodLog({ mood: m });
      setSaved(res.data);
      setPhase({ name: "saved" });
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (!saved) return navigate("/dashboard");
    const patch = detailsPatch(saved, draftRef.current);
    if (Object.keys(patch).length === 0) return navigate("/dashboard");
    setBusy(true);
    try {
      await updateMoodLog(saved._id, patch);
      showToast.success("Saved. Thank you for sharing a little more.");
      navigate("/dashboard");
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "Couldn't save your details.");
      setBusy(false);
    }
  };

  const goToStep = (index: number) => (index >= STEP_FIELDS.length ? finish() : setPhase({ name: "step", index }));

  const next = (index: number) => {
    if (!isCurrentStep(index)) return;
    // After the intensity step, a strong low mood gets the support screen once.
    if (index === 0 && !supportShown && supportLevel(mood, draftRef.current.intensity) === "full") {
      setSupportShown(true);
      return setPhase({ name: "support" });
    }
    goToStep(index + 1);
  };

  const skip = (index: number) => {
    if (!isCurrentStep(index)) return;
    const cleared = { ...draftRef.current };
    for (const f of STEP_FIELDS[index]) delete cleared[f];
    draftRef.current = cleared;
    setDraft(cleared);
    goToStep(index + 1);
  };

  const doneFromStep = (index: number) => {
    if (isCurrentStep(index)) finish();
  };

  const savedTime = saved?.createdAt
    ? new Date(saved.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="mx-auto max-w-[560px] px-5 pb-28 pt-8 sm:pt-14">
      <AnimatePresence mode="wait">
        {phase.name === "pick" && (
          <motion.section key="pick" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="rounded-[28px] bg-hero p-5 sm:p-8">
              <h1 className="font-serif text-[28px] font-medium leading-tight text-foreground sm:text-[34px]">
                How are you feeling right now?
              </h1>
              <MoodPicker onPick={quickLog} disabled={busy} className="mt-6 sm:grid-cols-3" />
              <p className="mt-4 text-[13px] text-muted-foreground">One tap saves it. You can add more after.</p>
            </div>
          </motion.section>
        )}

        {phase.name === "saved" && saved && (
          <motion.section key="saved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
            <motion.div className="mx-auto w-fit" animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 4, repeat: 1, ease: "easeInOut" }}>
              <MoodFace mood={mood} size={112} />
            </motion.div>
            <h1 className="mt-6 text-balance font-serif text-[28px] font-medium text-foreground sm:text-[34px]">
              Saved. Thank you for checking in.
            </h1>
            <p className="mt-2 text-muted-foreground">
              “{moodInfo.label}” is in your journal{savedTime ? ` for ${savedTime}` : ""}.
            </p>

            {supportLevel(mood) === "nudge" && !nudgeDismissed && (
              <div className="mt-7">
                <SupportNudge mood={mood} onDismiss={() => setNudgeDismissed(true)} />
              </div>
            )}

            <p className="mt-9 text-foreground">Want to add a little more?</p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <Button className="h-12 w-full max-w-[320px] rounded-full text-base" onClick={() => setPhase({ name: "step", index: 0 })}>
                Add details
              </Button>
              <Button variant="ghost" className="h-12 rounded-full text-base text-muted-foreground" onClick={() => navigate("/dashboard")}>
                I'm done for now
              </Button>
            </div>
          </motion.section>
        )}

        {phase.name === "support" && (
          <motion.section key="support" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h1 className={headingClass}>That sounds like a lot to carry.</h1>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              You don't have to do anything with this. If it would help, here are a few options.
            </p>
            <div className="mt-6">
              <SupportPanel mood={mood} />
            </div>
            <div className="mt-8 flex justify-end">
              <Button className="h-12 rounded-full px-6 text-base" onClick={() => goToStep(1)}>
                Continue
              </Button>
            </div>
          </motion.section>
        )}

        {phase.name === "step" && (
          <motion.section
            key={`step-${phase.index}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
          >
            <div className="flex items-center gap-1.5" aria-hidden>
              {STEP_FIELDS.map((_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= phase.index ? "bg-primary" : "bg-border"}`} />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">
                Step {phase.index + 1} of {STEP_FIELDS.length}
              </p>
              <button
                type="button"
                onClick={() => doneFromStep(phase.index)}
                disabled={busy}
                className="min-h-[44px] px-2 text-[13px] text-muted-foreground hover:text-foreground"
              >
                I'm done
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3">
              {phase.index === 0 && <MoodFace mood={mood} size={44} decorative />}
              <h1 className={headingClass}>{STEP_TITLES[phase.index]}</h1>
            </div>

            <div className="mt-8 space-y-8">
              {phase.index === 0 && (
                <>
                  <ScalePicker
                    label="Intensity"
                    min={1}
                    max={10}
                    value={draft.intensity}
                    onChange={(v) => set("intensity", v)}
                    lowLabel="A little"
                    highLabel="Very strong"
                  />
                  {moodInfo.known && moodInfo.key !== "other" && (
                    <div>
                      <span className={fieldLabel}>A word that fits better? (optional)</span>
                      <ChoiceChips
                        label="Specific feeling"
                        options={SUB_MOODS[moodInfo.key].map((s) => ({ value: s, label: s }))}
                        value={draft.specificEmotion}
                        onChange={(v) => set("specificEmotion", v)}
                      />
                    </div>
                  )}
                </>
              )}

              {phase.index === 1 && (
                <>
                  <div>
                    <span className={fieldLabel}>Energy</span>
                    <ScalePicker label="Energy" min={1} max={10} value={draft.energyLevel} onChange={(v) => set("energyLevel", v)} lowLabel="Drained" highLabel="Full of energy" />
                  </div>
                  <div>
                    <label htmlFor="sleep-hours" className={fieldLabel}>
                      Hours slept
                    </label>
                    <input
                      id="sleep-hours"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={24}
                      step={0.5}
                      value={draft.sleepHours ?? ""}
                      onChange={(e) => set("sleepHours", e.target.value === "" ? undefined : Math.min(24, Math.max(0, Number(e.target.value))))}
                      placeholder="e.g. 7"
                      className="h-12 w-32 rounded-2xl border border-input bg-card px-4 text-base text-foreground"
                    />
                  </div>
                  <div>
                    <span className={fieldLabel}>Sleep quality</span>
                    <ScalePicker label="Sleep quality" min={1} max={5} value={draft.sleepQuality} onChange={(v) => set("sleepQuality", v)} lowLabel="Poor" highLabel="Great" />
                  </div>
                  <div>
                    <span className={fieldLabel}>Did you move your body today?</span>
                    <ChoiceChips
                      label="Exercise"
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "Not today" },
                      ]}
                      value={draft.exercise === undefined ? undefined : draft.exercise ? "yes" : "no"}
                      onChange={(v) => {
                        set("exercise", v === undefined ? undefined : v === "yes");
                        if (v !== "yes") set("exerciseMinutes", undefined);
                      }}
                    />
                    {draft.exercise && (
                      <div className="mt-4">
                        <label htmlFor="exercise-minutes" className="mb-2 block text-sm text-muted-foreground">
                          Roughly how many minutes? (optional)
                        </label>
                        <input
                          id="exercise-minutes"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={draft.exerciseMinutes ?? ""}
                          onChange={(e) =>
                            set("exerciseMinutes", e.target.value === "" ? undefined : Math.max(0, Math.round(Number(e.target.value))))
                          }
                          placeholder="e.g. 30"
                          className="h-12 w-32 rounded-2xl border border-input bg-card px-4 text-base text-foreground"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {phase.index === 2 && (
                <>
                  <div>
                    <span className={fieldLabel}>Stress</span>
                    <ScalePicker label="Stress" min={1} max={10} value={draft.stressLevel} onChange={(v) => set("stressLevel", v)} lowLabel="Relaxed" highLabel="Very stressed" />
                  </div>
                  <div>
                    <span className={fieldLabel}>Anxiety</span>
                    <ScalePicker label="Anxiety" min={1} max={10} value={draft.anxietyLevel} onChange={(v) => set("anxietyLevel", v)} lowLabel="Settled" highLabel="Very anxious" />
                  </div>
                  <div>
                    <span className={fieldLabel}>Time with people</span>
                    <ChoiceChips label="Social" options={SOCIAL} value={draft.socialQuality} onChange={(v) => set("socialQuality", v)} />
                  </div>
                  <div>
                    <span className={fieldLabel}>What's behind it?</span>
                    <ChoiceChips label="Trigger" options={TRIGGERS} value={draft.moodTriggerCategory} onChange={(v) => set("moodTriggerCategory", v)} />
                  </div>
                  <ChipInput label="Who were you with?" value={draft.tagsPeople ?? []} onChange={(v) => set("tagsPeople", v)} suggestions={suggestions.people} placeholder="Type a name, press Enter" />
                  <ChipInput label="Where were you?" value={draft.tagsPlaces ?? []} onChange={(v) => set("tagsPlaces", v)} suggestions={suggestions.places} placeholder="e.g. Home" />
                  <ChipInput label="What happened?" value={draft.tagsEvents ?? []} onChange={(v) => set("tagsEvents", v)} suggestions={suggestions.events} placeholder="e.g. Meeting" />
                </>
              )}

              {phase.index === 3 && (
                <>
                  <div>
                    <label htmlFor="notes" className={fieldLabel}>
                      Anything you want to remember?
                    </label>
                    <Textarea id="notes" rows={4} maxLength={2000} value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className="rounded-2xl text-base" />
                  </div>
                  <div>
                    <label htmlFor="reflections" className={fieldLabel}>
                      A reflection, if you'd like
                    </label>
                    <Textarea id="reflections" rows={3} maxLength={2000} value={draft.reflections ?? ""} onChange={(e) => set("reflections", e.target.value)} placeholder="What helped? What would you tell a friend?" className="rounded-2xl text-base" />
                  </div>
                </>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between">
              <Button variant="ghost" className="h-12 rounded-full px-5 text-base text-muted-foreground" onClick={() => skip(phase.index)} disabled={busy}>
                Skip
              </Button>
              <Button className="h-12 rounded-full px-6 text-base" onClick={() => (phase.index === STEP_FIELDS.length - 1 ? doneFromStep(phase.index) : next(phase.index))} disabled={busy}>
                {phase.index === STEP_FIELDS.length - 1 ? "Save" : "Next"}
              </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
