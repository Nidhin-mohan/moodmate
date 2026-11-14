import type { IMoodLog } from '../models/moodLogModel';

/**
 * Weekly aggregate for the AI analysis and its email.
 * Every average is taken only over logs that recorded that field, and is
 * `null` when none did — mood-only logs never pull averages towards 0 or NaN.
 */
export interface WeeklyStats {
  avgIntensity: number | null;
  avgEnergyLevel: number | null;
  avgStressLevel: number | null;
  avgAnxietyLevel: number | null;
  avgSleepHours: number | null;
  avgSleepQuality: number | null;
  exerciseDays: number;
  avgExerciseMinutes: number | null;
  totalLogs: number;
}

/** Mean rounded to one decimal, or null for an empty set. */
export function avgOrNull(values: Array<number | null | undefined>): number | null {
  const present = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (present.length === 0) return null;
  return Math.round((present.reduce((a, b) => a + b, 0) / present.length) * 10) / 10;
}

export function computeWeeklyStats(logs: IMoodLog[]): WeeklyStats {
  return {
    avgIntensity: avgOrNull(logs.map((l) => l.intensity)),
    avgEnergyLevel: avgOrNull(logs.map((l) => l.energyLevel)),
    avgStressLevel: avgOrNull(logs.map((l) => l.stressLevel)),
    avgAnxietyLevel: avgOrNull(logs.map((l) => l.anxietyLevel)),
    avgSleepHours: avgOrNull(logs.map((l) => l.sleepHours)),
    avgSleepQuality: avgOrNull(logs.map((l) => l.sleepQuality)),
    exerciseDays: logs.filter((l) => l.exercise === true).length,
    avgExerciseMinutes: avgOrNull(logs.map((l) => l.exerciseMinutes)),
    totalLogs: logs.length,
  };
}
