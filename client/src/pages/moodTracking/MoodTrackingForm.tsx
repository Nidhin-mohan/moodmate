import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider"; 
import { Switch } from "@/components/ui/switch"; 
import { showToast } from "@/utils/toast";
import api from "@/api";
import { 
  Smile, Frown, Meh, Angry, Zap, Activity,
  MapPin, Users, Calendar, Moon
} from "lucide-react";

// --- Configuration: Mood Hierarchy ---
const MOOD_OPTIONS = [
  { 
    label: "Happy", 
    icon: Smile, 
    color: "text-green-500", 
    bg: "bg-green-50", 
    border: "border-green-200",
    subMoods: ["Optimistic", "Content", "Proud", "Grateful", "Relieved"] 
  },
  { 
    label: "Excited", 
    icon: Zap, 
    color: "text-yellow-500", 
    bg: "bg-yellow-50", 
    border: "border-yellow-200",
    subMoods: ["Energetic", "Motivated", "Manic", "Curious", "Hopeful"]
  },
  { 
    label: "Neutral", 
    icon: Meh, 
    color: "text-slate-500", 
    bg: "bg-slate-50", 
    border: "border-slate-200",
    subMoods: ["Calm", "Bored", "Indifferent", "Numb", "Tired"]
  },
  { 
    label: "Sad", 
    icon: Frown, 
    color: "text-blue-500", 
    bg: "bg-blue-50", 
    border: "border-blue-200",
    subMoods: ["Lonely", "Depressed", "Disappointed", "Hurt", "Grieving"]
  },
  { 
    label: "Anxious", 
    icon: Activity, 
    color: "text-purple-500", 
    bg: "bg-purple-50", 
    border: "border-purple-200",
    subMoods: ["Stressed", "Overwhelmed", "Nervous", "Insecure", "Panic"]
  },
  { 
    label: "Angry", 
    icon: Angry, 
    color: "text-red-500", 
    bg: "bg-red-50", 
    border: "border-red-200",
    subMoods: ["Frustrated", "Irritated", "Jealous", "Resentful", "Rage"]
  },
];

// --- Validation Schema ---
const moodSchema = z.object({
  // Emotions
  mood: z.string().min(1, "Please select a mood"),
  specificEmotion: z.string().optional(),
  intensity: z.number().min(1).max(10),
  energyLevel: z.number().min(1).max(10),
  
  // Context
  tagsPeople: z.string().optional(),
  tagsPlaces: z.string().optional(),
  tagsEvents: z.string().optional(),

  // Physiology
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(5),
  exercise: z.boolean(),
  
  // Journal
  notes: z.string().optional(),
  reflections: z.string().optional(),
});

type MoodFormData = z.infer<typeof moodSchema>;

export default function MoodTrackingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MoodFormData>({
    resolver: zodResolver(moodSchema),
    defaultValues: {
      intensity: 5,
      energyLevel: 5,
      sleepHours: 7,
      sleepQuality: 3,
      exercise: false,
    }
  });

  const selectedMoodLabel = watch("mood");
  const selectedSpecific = watch("specificEmotion");
  
  // Find the config object for the currently selected mood
  const currentMoodObj = MOOD_OPTIONS.find(m => m.label === selectedMoodLabel);

  const onSubmit = async (data: MoodFormData) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, date: new Date().toISOString() };
      await api.post("/mood/track", payload);
      showToast.success("Check-in saved successfully!");
    } catch (error) {
      console.error(error);
      showToast.error("Failed to save check-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">Daily Check-in</h1>
        <p className="text-slate-500">Take a moment to reflect on your day.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* --- Section 1: Emotional State --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Smile size={20} className="text-teal-600"/> Emotional State
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
                    setValue("specificEmotion", ""); // Reset sub-mood on change
                  }}
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                    ${isSelected 
                      ? `${m.bg} ${m.border} ring-2 ring-offset-1 ring-${m.color.split('-')[1]}-400` 
                      : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"}
                  `}
                >
                  <m.icon size={28} className={`mb-2 ${isSelected ? m.color : "text-slate-400"}`} />
                  <span className={`text-sm font-medium ${isSelected ? "text-slate-900" : "text-slate-500"}`}>{m.label}</span>
                </button>
              );
            })}
          </div>
          {errors.mood && <p className="text-red-500 text-sm text-center mb-4">{errors.mood.message}</p>}

          {/* Child Mood Chips (Specific Emotion) */}
          {currentMoodObj && (
             <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-50 p-4 rounded-xl">
               <label className="text-sm font-medium text-slate-600 mb-3 block">
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
                           ? "bg-slate-800 text-white border-slate-800 shadow-md transform scale-105" 
                           : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}
                       `}
                     >
                       {sub}
                     </button>
                   )
                 })}
               </div>
             </div>
          )}

          {/* Sliders for Intensity & Energy */}
          <div className="grid md:grid-cols-2 gap-8 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-4">
                Mood Intensity (1-10)
              </label>
              <Controller
                control={control}
                name="intensity"
                render={({ field }) => (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-300">1</span>
                    <Slider
                      defaultValue={[field.value]}
                      max={10}
                      min={1}
                      step={1}
                      onValueChange={(vals : any[]) => field.onChange(vals[0])}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold text-teal-600 w-6 text-center">{field.value}</span>
                  </div>
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-4">
                Energy Level (1-10)
              </label>
              <Controller
                control={control}
                name="energyLevel"
                render={({ field }) => (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-300">1</span>
                    <Slider
                      defaultValue={[field.value]}
                      max={10}
                      min={1}
                      step={1}
                      onValueChange={(vals : any[]) => field.onChange(vals[0])}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold text-yellow-600 w-6 text-center">{field.value}</span>
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* --- Section 2: Context --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-teal-600"/> Context
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 flex gap-1 items-center">
                <Users size={14} /> Who were you with?
              </label>
              <Input placeholder="e.g. Friends, Alone" {...register("tagsPeople")} className="bg-slate-50" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 flex gap-1 items-center">
                <MapPin size={14} /> Where were you?
              </label>
              <Input placeholder="e.g. Home, Work" {...register("tagsPlaces")} className="bg-slate-50" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 flex gap-1 items-center">
                <Calendar size={14} /> What were you doing?
              </label>
              <Input placeholder="e.g. Working, Relaxing" {...register("tagsEvents")} className="bg-slate-50" />
            </div>
          </div>
        </div>

        {/* --- Section 3: Physiology --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Moon size={20} className="text-teal-600"/> Body & Health
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sleep Inputs */}
            <div className="space-y-4">
               <div>
                  <label className="text-sm font-medium text-slate-600">Hours Slept</label>
                  <Input type="number" step="0.5" {...register("sleepHours", { valueAsNumber: true })} className="bg-slate-50 mt-1"/>
               </div>
               <div>
                  <label className="text-sm font-medium text-slate-600 mb-2 block">Sleep Quality (1-5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((stars) => (
                       <button
                         key={stars}
                         type="button"
                         onClick={() => setValue("sleepQuality", stars)}
                         className={`h-8 w-8 rounded-full text-sm font-bold transition-colors ${watch("sleepQuality") === stars ? "bg-indigo-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                       >
                         {stars}
                       </button>
                    ))}
                  </div>
               </div>
            </div>

            {/* Exercise Toggle */}
            <div className="flex flex-col justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-slate-700">Did you exercise today?</label>
                  <Controller
                    control={control}
                    name="exercise"
                    render={({ field }) => (
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    )}
                  />
               </div>
               <p className="text-xs text-slate-500">Even a 10 min walk counts!</p>
            </div>
          </div>
        </div>

        {/* --- Section 4: Journaling --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Journal & Reflections</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Notes / What's on your mind?</label>
              <Textarea 
                placeholder="Write freely here..." 
                className="bg-slate-50 min-h-[100px] border-slate-200 focus:border-teal-500 focus:ring-teal-500/20" 
                {...register("notes")} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Key Takeaways / Gratitude</label>
              <Textarea 
                placeholder="One thing I learned today..." 
                className="bg-slate-50 min-h-[80px] border-slate-200 focus:border-teal-500 focus:ring-teal-500/20" 
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