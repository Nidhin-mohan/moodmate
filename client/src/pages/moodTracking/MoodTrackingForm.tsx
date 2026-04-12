import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { showToast } from "@/utils/toast";
import { createMoodLog } from "@/services/moodLogService";
import type { SocialQuality, MoodTriggerCategory } from "@/services/moodLogService";
import {
  Smile, Frown, Meh, Angry, Zap, Activity,
  MapPin, Users, Calendar, Moon, Brain, Timer, Tag,
} from "lucide-react";

// --- Configuration: Mood Hierarchy ---
const MOOD_OPTIONS = [
  {
    label: "Happy",
    icon: Smile,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-300 dark:border-green-700",
    subMoods: ["Optimistic", "Content", "Proud", "Grateful", "Relieved"],
  },
  {
    label: "Excited",
    icon: Zap,
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-300 dark:border-yellow-700",
    subMoods: ["Energetic", "Motivated", "Manic", "Curious", "Hopeful"],
  },
  {
    label: "Neutral",
    icon: Meh,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    subMoods: ["Calm", "Bored", "Indifferent", "Numb", "Tired"],
  },
  {
    label: "Sad",
    icon: Frown,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-300 dark:border-blue-700",
    subMoods: ["Lonely", "Depressed", "Disappointed", "Hurt", "Grieving"],
  },
  {
    label: "Anxious",
    icon: Activity,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-300 dark:border-purple-700",
    subMoods: ["Stressed", "Overwhelmed", "Nervous", "Insecure", "Panic"],
  },
  {
    label: "Angry",
    icon: Angry,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-300 dark:border-red-700",
    subMoods: ["Frustrated", "Irritated", "Jealous", "Resentful", "Rage"],
  },
];

const SOCIAL_QUALITY_OPTIONS: { value: SocialQuality; label: string; emoji: string }[] = [
  { value: "isolated", label: "Isolated", emoji: "😶" },
  { value: "neutral", label: "Neutral", emoji: "🤝" },
  { value: "connected", label: "Connected", emoji: "😊" },
];

const TRIGGER_OPTIONS: { value: MoodTriggerCategory; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "relationships", label: "Relationships" },
  { value: "health", label: "Health" },
  { value: "finances", label: "Finances" },
  { value: "environment", label: "Environment" },
  { value: "random", label: "No clear reason" },
];

// --- Validation Schema ---
const moodSchema = z.object({
  mood: z.string().min(1, "Please select a mood"),
  specificEmotion: z.string().optional(),
  intensity: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10),
  anxietyLevel: z.number().min(1).max(10),
  tagsPeople: z.string().optional(),
  tagsPlaces: z.string().optional(),
  tagsEvents: z.string().optional(),
  socialQuality: z.enum(["isolated", "neutral", "connected"]).optional(),
  moodTriggerCategory: z
    .enum(["work", "relationships", "health", "finances", "environment", "random"])
    .optional(),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(5),
  exercise: z.boolean(),
  exerciseMinutes: z.number().min(0).optional(),
  notes: z.string().optional(),
  reflections: z.string().optional(),
});

type MoodFormData = z.infer<typeof moodSchema>;

// Reusable class strings for the repeated section card pattern
const sectionCard = "bg-card p-6 rounded-2xl shadow-sm border border-border";
const sectionHeading = "text-base font-semibold text-foreground mb-4 flex items-center gap-2";
const fieldLabel = "text-sm font-medium text-muted-foreground";

export default function MoodTrackingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MoodFormData>({
    resolver: zodResolver(moodSchema),
    defaultValues: {
      intensity: 5,
      energyLevel: 5,
      stressLevel: 5,
      anxietyLevel: 5,
      sleepHours: 7,
      sleepQuality: 3,
      exercise: false,
    },
  });

  const selectedMoodLabel = watch("mood");
  const selectedSpecific = watch("specificEmotion");
  const exerciseOn = watch("exercise");
  const selectedSocialQuality = watch("socialQuality");
  const selectedTrigger = watch("moodTriggerCategory");

  const currentMoodObj = MOOD_OPTIONS.find((m) => m.label === selectedMoodLabel);

  const parseTagString = (value?: string): string[] => {
    if (!value) return [];
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const onInvalid = () => {
    showToast.error("Please select a mood before saving your check-in.");
  };

  const onSubmit = async (data: MoodFormData) => {
    setIsSubmitting(true);
    try {
      await createMoodLog({
        mood: data.mood,
        specificEmotion: data.specificEmotion || undefined,
        intensity: data.intensity,
        energyLevel: data.energyLevel,
        stressLevel: data.stressLevel,
        anxietyLevel: data.anxietyLevel,
        tagsPeople: parseTagString(data.tagsPeople),
        tagsPlaces: parseTagString(data.tagsPlaces),
        tagsEvents: parseTagString(data.tagsEvents),
        socialQuality: data.socialQuality,
        moodTriggerCategory: data.moodTriggerCategory,
        sleepHours: data.sleepHours,
        sleepQuality: data.sleepQuality,
        exercise: data.exercise,
        exerciseMinutes: data.exercise ? data.exerciseMinutes : undefined,
        notes: data.notes || undefined,
        reflections: data.reflections || undefined,
        date: new Date().toISOString(),
      });
      showToast.success("Check-in saved successfully!");
      reset();
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save check-in.";
      showToast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">

      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Daily Check-in</h1>
        <p className="text-muted-foreground text-sm mt-1">Take a moment to reflect on your day.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">

        {/* --- Section 1: Emotional State --- */}
        <div className={sectionCard}>
          <h2 className={sectionHeading}>
            <Smile size={18} className="text-primary" /> Emotional State
          </h2>

          {/* Parent Mood Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {MOOD_OPTIONS.map((m) => {
              const isSelected = selectedMoodLabel === m.label;
              return (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => {
                    setValue("mood", m.label);
                    setValue("specificEmotion", "");
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `${m.bg} ${m.border} ring-2 ring-offset-1 ring-primary/30`
                      : "bg-card border-border hover:border-primary/30 hover:bg-muted"
                  }`}
                >
                  <m.icon
                    size={26}
                    className={`mb-1.5 ${isSelected ? m.color : "text-muted-foreground"}`}
                  />
                  <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.mood && (
            <p className="text-destructive text-sm text-center mb-4">{errors.mood.message}</p>
          )}

          {/* Child Mood Chips */}
          {currentMoodObj && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 bg-muted p-4 rounded-xl">
              <label className={`${fieldLabel} mb-3 block`}>
                Let's get specific… (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {currentMoodObj.subMoods.map((sub) => {
                  const isSubSelected = selectedSpecific === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setValue("specificEmotion", sub)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        isSubSelected
                          ? "bg-foreground text-background border-foreground shadow-sm"
                          : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sliders */}
          <div className="grid md:grid-cols-2 gap-8 pt-2 border-t border-border">
            {[
              { name: "intensity" as const, label: "Mood Intensity", color: "text-primary" },
              { name: "energyLevel" as const, label: "Energy Level", color: "text-yellow-600" },
              { name: "stressLevel" as const, label: "Stress Level", color: "text-orange-500" },
              { name: "anxietyLevel" as const, label: "Anxiety Level", color: "text-purple-600" },
            ].map(({ name, label, color }) => (
              <div key={name}>
                <label className={`block ${fieldLabel} mb-4`}>
                  {label} (1–10)
                </label>
                <Controller
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-muted-foreground/50">1</span>
                      <Slider
                        defaultValue={[field.value]}
                        max={10}
                        min={1}
                        step={1}
                        onValueChange={(vals: number[]) => field.onChange(vals[0])}
                        className="flex-1"
                      />
                      <span className={`text-sm font-bold ${color} w-6 text-center`}>
                        {field.value}
                      </span>
                    </div>
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* --- Section 2: Context --- */}
        <div className={sectionCard}>
          <h2 className={sectionHeading}>
            <MapPin size={18} className="text-primary" /> Context
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className={`${fieldLabel} mb-1 flex gap-1 items-center`}>
                <Users size={13} /> Who were you with?
              </label>
              <Input
                placeholder="e.g. Friends, Alone"
                {...register("tagsPeople")}
                className="bg-muted border-border mt-1"
              />
            </div>
            <div>
              <label className={`${fieldLabel} mb-1 flex gap-1 items-center`}>
                <MapPin size={13} /> Where were you?
              </label>
              <Input
                placeholder="e.g. Home, Work"
                {...register("tagsPlaces")}
                className="bg-muted border-border mt-1"
              />
            </div>
            <div>
              <label className={`${fieldLabel} mb-1 flex gap-1 items-center`}>
                <Calendar size={13} /> What were you doing?
              </label>
              <Input
                placeholder="e.g. Working, Relaxing"
                {...register("tagsEvents")}
                className="bg-muted border-border mt-1"
              />
            </div>
          </div>

          {/* Social Quality */}
          <div className="mb-6">
            <label className={`${fieldLabel} mb-3 flex gap-1 items-center`}>
              <Users size={13} /> How did your social interactions feel? (Optional)
            </label>
            <div className="flex gap-3">
              {SOCIAL_QUALITY_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setValue("socialQuality", selectedSocialQuality === value ? undefined : value)
                  }
                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                    selectedSocialQuality === value
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Trigger */}
          <div>
            <label className={`${fieldLabel} mb-3 flex gap-1 items-center`}>
              <Tag size={13} /> What triggered this mood? (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {TRIGGER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setValue("moodTriggerCategory", selectedTrigger === value ? undefined : value)
                  }
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedTrigger === value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Section 3: Physiology --- */}
        <div className={sectionCard}>
          <h2 className={sectionHeading}>
            <Moon size={18} className="text-primary" /> Body & Health
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Sleep Inputs */}
            <div className="space-y-4">
              <div>
                <label className={`${fieldLabel} block mb-1`}>Hours Slept</label>
                <Input
                  type="number"
                  step="0.5"
                  {...register("sleepHours", { valueAsNumber: true })}
                  className="bg-muted border-border mt-1"
                />
              </div>
              <div>
                <label className={`${fieldLabel} mb-2 block`}>
                  Sleep Quality (1–5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setValue("sleepQuality", stars)}
                      className={`h-9 w-9 rounded-full text-sm font-bold transition-colors ${
                        watch("sleepQuality") === stars
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {stars}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Exercise */}
            <div className="flex flex-col justify-start p-4 bg-muted rounded-xl border border-border gap-4">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground text-sm">Did you exercise today?</label>
                <Controller
                  control={control}
                  name="exercise"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              {exerciseOn && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className={`${fieldLabel} mb-1 flex items-center gap-1`}>
                    <Timer size={13} /> How many minutes?
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 30"
                    {...register("exerciseMinutes", { valueAsNumber: true })}
                    className="bg-card border-border"
                  />
                </div>
              )}
              {!exerciseOn && (
                <p className="text-xs text-muted-foreground">Even a 10 min walk counts!</p>
              )}
            </div>
          </div>
        </div>

        {/* --- Section 4: Journaling --- */}
        <div className={sectionCard}>
          <h2 className={sectionHeading}>
            <Brain size={18} className="text-primary" /> Journal & Reflections
          </h2>
          <div className="space-y-4">
            <div>
              <label className={`${fieldLabel} mb-1 block`}>
                Notes / What's on your mind?
              </label>
              <Textarea
                placeholder="Write freely here…"
                className="bg-muted border-border min-h-[100px] focus-visible:ring-ring mt-1"
                {...register("notes")}
              />
            </div>
            <div>
              <label className={`${fieldLabel} mb-1 block`}>
                Key Takeaways / Gratitude
              </label>
              <Textarea
                placeholder="One thing I learned today…"
                className="bg-muted border-border min-h-[80px] focus-visible:ring-ring mt-1"
                {...register("reflections")}
              />
            </div>
          </div>
        </div>

        {/* --- Submit Button --- */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold rounded-xl shadow-md"
        >
          {isSubmitting ? "Saving…" : "Save Check-in"}
        </Button>
      </form>
    </div>
  );
}
