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
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-700",
    subMoods: ["Optimistic", "Content", "Proud", "Grateful", "Relieved"],
  },
  {
    label: "Excited",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-700",
    subMoods: ["Energetic", "Motivated", "Manic", "Curious", "Hopeful"],
  },
  {
    label: "Neutral",
    icon: Meh,
    color: "text-slate-500",
    bg: "bg-slate-50 dark:bg-slate-700",
    border: "border-slate-200 dark:border-slate-600",
    subMoods: ["Calm", "Bored", "Indifferent", "Numb", "Tired"],
  },
  {
    label: "Sad",
    icon: Frown,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    subMoods: ["Lonely", "Depressed", "Disappointed", "Hurt", "Grieving"],
  },
  {
    label: "Anxious",
    icon: Activity,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-700",
    subMoods: ["Stressed", "Overwhelmed", "Nervous", "Insecure", "Panic"],
  },
  {
    label: "Angry",
    icon: Angry,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-700",
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
  // Emotions
  mood: z.string().min(1, "Please select a mood"),
  specificEmotion: z.string().optional(),
  intensity: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10),
  anxietyLevel: z.number().min(1).max(10),

  // Context
  tagsPeople: z.string().optional(),
  tagsPlaces: z.string().optional(),
  tagsEvents: z.string().optional(),
  socialQuality: z.enum(["isolated", "neutral", "connected"]).optional(),
  moodTriggerCategory: z
    .enum(["work", "relationships", "health", "finances", "environment", "random"])
    .optional(),

  // Physiology
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(5),
  exercise: z.boolean(),
  exerciseMinutes: z.number().min(0).optional(),

  // Journal
  notes: z.string().optional(),
  reflections: z.string().optional(),
});

type MoodFormData = z.infer<typeof moodSchema>;

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
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Daily Check-in</h1>
        <p className="text-slate-500 dark:text-slate-400">Take a moment to reflect on your day.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">

        {/* --- Section 1: Emotional State --- */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Smile size={20} className="text-teal-600" /> Emotional State
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
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                    ${isSelected
                      ? `${m.bg} ${m.border} ring-2 ring-offset-1 ring-${m.color.split("-")[1]}-400`
                      : "bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600"}
                  `}
                >
                  <m.icon size={28} className={`mb-2 ${isSelected ? m.color : "text-slate-400 dark:text-slate-500"}`} />
                  <span className={`text-sm font-medium ${isSelected ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.mood && (
            <p className="text-red-500 text-sm text-center mb-4">{errors.mood.message}</p>
          )}

          {/* Child Mood Chips */}
          {currentMoodObj && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 block">
                Let's get specific... (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {currentMoodObj.subMoods.map((sub) => {
                  const isSubSelected = selectedSpecific === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setValue("specificEmotion", sub)}
                      className={`
                        px-4 py-2 rounded-full text-sm font-medium transition-all border
                        ${isSubSelected
                          ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200 shadow-md transform scale-105"
                          : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"}
                      `}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sliders: Intensity, Energy, Stress, Anxiety */}
          <div className="grid md:grid-cols-2 gap-8 pt-2 border-t border-slate-100 dark:border-slate-700">
            {[
              { name: "intensity" as const, label: "Mood Intensity", color: "text-teal-600" },
              { name: "energyLevel" as const, label: "Energy Level", color: "text-yellow-600" },
              { name: "stressLevel" as const, label: "Stress Level", color: "text-orange-500" },
              { name: "anxietyLevel" as const, label: "Anxiety Level", color: "text-purple-500" },
            ].map(({ name, label, color }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">
                  {label} (1–10)
                </label>
                <Controller
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-300 dark:text-slate-600">1</span>
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
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-teal-600" /> Context
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 flex gap-1 items-center">
                <Users size={14} /> Who were you with?
              </label>
              <Input placeholder="e.g. Friends, Alone" {...register("tagsPeople")} className="bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 flex gap-1 items-center">
                <MapPin size={14} /> Where were you?
              </label>
              <Input placeholder="e.g. Home, Work" {...register("tagsPlaces")} className="bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 flex gap-1 items-center">
                <Calendar size={14} /> What were you doing?
              </label>
              <Input placeholder="e.g. Working, Relaxing" {...register("tagsEvents")} className="bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500" />
            </div>
          </div>

          {/* Social Quality */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex gap-1 items-center">
              <Users size={14} /> How did your social interactions feel? (Optional)
            </label>
            <div className="flex gap-3">
              {SOCIAL_QUALITY_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setValue("socialQuality", selectedSocialQuality === value ? undefined : value)
                  }
                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1
                    ${selectedSocialQuality === value
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                      : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"}`}
                >
                  <span className="text-xl">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Trigger */}
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex gap-1 items-center">
              <Tag size={14} /> What triggered this mood? (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {TRIGGER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setValue("moodTriggerCategory", selectedTrigger === value ? undefined : value)
                  }
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
                    ${selectedTrigger === value
                      ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Section 3: Physiology --- */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Moon size={20} className="text-teal-600" /> Body & Health
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Sleep Inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Hours Slept</label>
                <Input
                  type="number"
                  step="0.5"
                  {...register("sleepHours", { valueAsNumber: true })}
                  className="bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 block">
                  Sleep Quality (1–5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setValue("sleepQuality", stars)}
                      className={`h-8 w-8 rounded-full text-sm font-bold transition-colors
                        ${watch("sleepQuality") === stars
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"}`}
                    >
                      {stars}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Exercise */}
            <div className="flex flex-col justify-start p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 gap-4">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 dark:text-slate-200">Did you exercise today?</label>
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
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Timer size={14} /> How many minutes?
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 30"
                    {...register("exerciseMinutes", { valueAsNumber: true })}
                    className="bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                  />
                </div>
              )}
              {!exerciseOn && (
                <p className="text-xs text-slate-500 dark:text-slate-400">Even a 10 min walk counts!</p>
              )}
            </div>
          </div>
        </div>

        {/* --- Section 4: Journaling --- */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Brain size={20} className="text-teal-600" /> Journal & Reflections
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                Notes / What's on your mind?
              </label>
              <Textarea
                placeholder="Write freely here..."
                className="bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500 min-h-[100px] border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                {...register("notes")}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">
                Key Takeaways / Gratitude
              </label>
              <Textarea
                placeholder="One thing I learned today..."
                className="bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500 min-h-[80px] border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                {...register("reflections")}
              />
            </div>
          </div>
        </div>

        {/* --- Submit Button --- */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-teal-200/50 transition-all hover:scale-[1.01]"
        >
          {isSubmitting ? "Saving..." : "Save Check-in"}
        </Button>
      </form>
    </div>
  );
}
