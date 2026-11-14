import type { MoodLog } from "@/services/moodLogService";

/**
 * Human-readable details for only what was recorded — a mood-only entry gives
 * an empty list, never "undefined/10". E.g. ["Intensity 7/10", "Slept 6h"].
 */
export function recordedDetails(log: MoodLog): string[] {
  const parts: string[] = [];
  if (log.intensity != null) parts.push(`Intensity ${log.intensity}/10`);
  if (log.energyLevel != null) parts.push(`Energy ${log.energyLevel}/10`);
  if (log.stressLevel != null) parts.push(`Stress ${log.stressLevel}/10`);
  if (log.anxietyLevel != null) parts.push(`Anxiety ${log.anxietyLevel}/10`);
  if (log.sleepHours != null) parts.push(`Slept ${log.sleepHours}h`);
  if (log.sleepQuality != null) parts.push(`Sleep quality ${log.sleepQuality}/5`);
  if (log.exercise === true) parts.push(log.exerciseMinutes != null ? `Moved ${log.exerciseMinutes} min` : "Moved today");
  if (log.exercise === false) parts.push("Didn't exercise");
  return parts;
}
