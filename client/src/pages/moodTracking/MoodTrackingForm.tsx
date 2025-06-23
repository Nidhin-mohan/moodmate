import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/utils/toast";
import api from "@/api";
import { ChevronDown, ChevronUp } from "lucide-react";

// Define mood options
const moods = [
  "Happy",
  "Sad",
  "Anxious",
  "Stressed",
  "Excited",
  "Tired",
] as const;

// Define validation schema
const moodSchema = z.object({
  mood: z.enum(moods),
  moodScale: z.coerce.number().min(1).max(10),
  moodNote: z.string().optional(),
  sleepHours: z.coerce.number().min(0).max(12),
  exercise: z.boolean(),
  diet: z.enum(["Healthy", "Unhealthy", "Skipped Meals"]),
  socialInteraction: z.enum(["None", "Friends", "Family", "Work Event"]),
  workStress: z.enum(["None", "Mild", "High"]),
  weather: z.enum(["Sunny", "Rainy", "Cloudy", "Snowy"]),
  screenTime: z.coerce.number().min(0).max(24),
  musicListened: z.string().optional(),
  gratitudeEntry: z.string().optional(),
  goalProgress: z.enum(["On Track", "Falling Behind", "Not Set"]),
  triggerEvents: z.array(z.string()).optional(),
});

type MoodFormData = z.infer<typeof moodSchema>;

export default function MoodTrackingForm() {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    // watch,
    formState: { errors },
  } = useForm<MoodFormData>({
    resolver: zodResolver(moodSchema),
  });

  const onSubmit = async (data: MoodFormData) => {
    try {
      await api.post("/mood/track", data);
      showToast.success("Mood logged successfully!");
    } catch (error) {
      showToast.error("Failed to log mood");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md ml-40 mr-40">
      <h2 className="text-lg font-semibold">Log Your Mood</h2>

      <Toggle onPressedChange={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </Toggle>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        {/* Basic Mood Input */}
        <label>Mood:</label>
        <Select
          onValueChange={(value) =>
            setValue("mood", value as MoodFormData["mood"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Mood" />
          </SelectTrigger>
          <SelectContent>
            {moods.map((mood) => (
              <SelectItem key={mood} value={mood}>
                {mood}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.mood && <p className="text-red-500">{errors.mood.message}</p>}

        <label>Mood Scale (1-10):</label>
        <Input type="number" {...register("moodScale")} />
        {errors.moodScale && (
          <p className="text-red-500">{errors.moodScale.message}</p>
        )}

        <label>Notes:</label>
        <Textarea {...register("moodNote")} />

        {/* Expand for detailed logging */}
        {isExpanded && (
          <>
            <label>Sleep Hours:</label>
            <Input type="number" {...register("sleepHours")} />
            {errors.sleepHours && (
              <p className="text-red-500">{errors.sleepHours.message}</p>
            )}

            <label>Exercise:</label>
            <Checkbox
              onCheckedChange={(checked) =>
                setValue("exercise", checked as boolean)
              }
            />

            <label>Diet:</label>
            <Select
              onValueChange={(value) =>
                setValue("diet", value as MoodFormData["diet"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Diet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Healthy">Healthy</SelectItem>
                <SelectItem value="Unhealthy">Unhealthy</SelectItem>
                <SelectItem value="Skipped Meals">Skipped Meals</SelectItem>
              </SelectContent>
            </Select>

            <label>Social Interaction:</label>
            <Select
              onValueChange={(value) =>
                setValue(
                  "socialInteraction",
                  value as MoodFormData["socialInteraction"]
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Interaction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Friends">Friends</SelectItem>
                <SelectItem value="Family">Family</SelectItem>
                <SelectItem value="Work Event">Work Event</SelectItem>
              </SelectContent>
            </Select>

            <label>Work Stress:</label>
            <Select
              onValueChange={(value) =>
                setValue("workStress", value as MoodFormData["workStress"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Work Stress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Mild">Mild</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>

            <label>Weather:</label>
            <Select
              onValueChange={(value) =>
                setValue("weather", value as MoodFormData["weather"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Weather" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sunny">Sunny</SelectItem>
                <SelectItem value="Rainy">Rainy</SelectItem>
                <SelectItem value="Cloudy">Cloudy</SelectItem>
                <SelectItem value="Snowy">Snowy</SelectItem>
              </SelectContent>
            </Select>

            <label>Screen Time (in hours):</label>
            <Input type="number" {...register("screenTime")} />
            {errors.screenTime && (
              <p className="text-red-500">{errors.screenTime.message}</p>
            )}

            <label>Music Listened:</label>
            <Textarea {...register("musicListened")} />

            <label>Gratitude Entry:</label>
            <Textarea {...register("gratitudeEntry")} />

            <label>Goal Progress:</label>
            <Select
              onValueChange={(value) =>
                setValue("goalProgress", value as MoodFormData["goalProgress"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Goal Progress" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="On Track">On Track</SelectItem>
                <SelectItem value="Falling Behind">Falling Behind</SelectItem>
                <SelectItem value="Not Set">Not Set</SelectItem>
              </SelectContent>
            </Select>

            <label>Trigger Events:</label>
            <Textarea {...register("triggerEvents")} />
          </>
        )}

        <Button type="submit" className="mt-4 w-full">
          Submit Mood
        </Button>
      </form>
    </div>
  );
}
