import { IMoodLog } from '../models/moodLogModel';
import { moodLogRepository } from '../repositories/moodLogRepository';
import { generate } from './ai/ai.service';

export interface WeeklyStats {
  avgIntensity: number;
  avgEnergyLevel: number;
  avgStressLevel: number | null;
  avgAnxietyLevel: number | null;
  avgSleepHours: number;
  avgSleepQuality: number;
  exerciseDays: number;
  avgExerciseMinutes: number | null;
  totalLogs: number;
}

export interface WeeklyAnalysisSuccess {
  status: 'success';
  analysis: string;
  stats: WeeklyStats;
  provider: string;
}

export interface WeeklyAnalysisInsufficient {
  status: 'insufficient_data';
}

export type WeeklyAnalysisResult = WeeklyAnalysisSuccess | WeeklyAnalysisInsufficient;

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function buildPrompt(logs: IMoodLog[], stats: WeeklyStats): string {
  const logLines = logs
    .map((log) => {
      const date = new Date(log.date).toISOString().slice(0, 10);
      const tags = [
        ...log.tagsPeople.map((t) => `person:${t}`),
        ...log.tagsPlaces.map((t) => `place:${t}`),
        ...log.tagsEvents.map((t) => `event:${t}`),
      ].join(', ');
      const parts = [
        `[${date}] mood=${log.mood}${log.specificEmotion ? `/${log.specificEmotion}` : ''}`,
        `intensity=${log.intensity} energy=${log.energyLevel}`,
        log.stressLevel != null ? `stress=${log.stressLevel}` : null,
        log.anxietyLevel != null ? `anxiety=${log.anxietyLevel}` : null,
        `sleep=${log.sleepHours}h(quality ${log.sleepQuality}/5)`,
        log.exercise
          ? `exercise=yes${log.exerciseMinutes != null ? `(${log.exerciseMinutes}min)` : ''}`
          : 'exercise=no',
        log.socialQuality ? `social=${log.socialQuality}` : null,
        log.moodTriggerCategory ? `trigger=${log.moodTriggerCategory}` : null,
        tags ? `tags=[${tags}]` : null,
        log.notes ? `notes="${log.notes}"` : null,
      ];
      return parts.filter(Boolean).join(' ');
    })
    .join('\n');

  return `You are a wellness assistant for MoodMate, a mood tracking app.

Weekly stats (last 7 days, ${stats.totalLogs} entries):
- Avg intensity: ${stats.avgIntensity}/10
- Avg energy: ${stats.avgEnergyLevel}/10
${stats.avgStressLevel != null ? `- Avg stress: ${stats.avgStressLevel}/10\n` : ''}- Avg anxiety: ${stats.avgAnxietyLevel != null ? `${stats.avgAnxietyLevel}/10` : 'not recorded'}
- Avg sleep: ${stats.avgSleepHours}h (quality ${stats.avgSleepQuality}/5)
- Exercise days: ${stats.exerciseDays}/${stats.totalLogs}${stats.avgExerciseMinutes != null ? ` (avg ${stats.avgExerciseMinutes}min)` : ''}

Daily logs:
${logLines}

Provide a brief weekly mood analysis covering:
1. Pattern summary (dominant moods and trends)
2. Key correlations (sleep vs mood, stress/anxiety trends, exercise vs energy, social quality vs mood, trigger patterns)
3. One positive observation
4. Two actionable suggestions for the coming week

Rules:
- Keep response under 250 words
- Do not diagnose any condition
- If intensity was below 4 for 4 or more days, suggest consulting a mental health professional
- Be warm and supportive in tone`;
}

export async function getWeeklyAnalysis(userId: string): Promise<WeeklyAnalysisResult> {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const logs = await moodLogRepository.findRecentByUser(userId, since);

  if (logs.length < 3) {
    return { status: 'insufficient_data' };
  }

  const stressValues = logs.map((l) => l.stressLevel).filter((v): v is number => v != null);
  const anxietyValues = logs.map((l) => l.anxietyLevel).filter((v): v is number => v != null);
  const exerciseMinValues = logs
    .map((l) => l.exerciseMinutes)
    .filter((v): v is number => v != null);

  const stats: WeeklyStats = {
    avgIntensity: avg(logs.map((l) => l.intensity)),
    avgEnergyLevel: avg(logs.map((l) => l.energyLevel)),
    avgStressLevel: stressValues.length ? avg(stressValues) : null,
    avgAnxietyLevel: anxietyValues.length ? avg(anxietyValues) : null,
    avgSleepHours: avg(logs.map((l) => l.sleepHours)),
    avgSleepQuality: avg(logs.map((l) => l.sleepQuality)),
    exerciseDays: logs.filter((l) => l.exercise).length,
    avgExerciseMinutes: exerciseMinValues.length ? avg(exerciseMinValues) : null,
    totalLogs: logs.length,
  };

  const prompt = buildPrompt(logs, stats);
  const { result: analysis, provider } = await generate(prompt);

  return { status: 'success', analysis: analysis ?? '', stats, provider };
}
