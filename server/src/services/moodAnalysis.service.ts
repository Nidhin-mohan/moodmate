import { IMoodLog } from '../models/moodLogModel';
import { moodLogRepository } from '../repositories/moodLogRepository';
import { generate } from './ai/ai.service';
import { computeWeeklyStats, type WeeklyStats } from './weeklyStats';

export type { WeeklyStats } from './weeklyStats';

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

// Every field except mood may be missing (quick logs), so each part is printed
// only when it was recorded — the AI never sees "undefined" or invented values.
function logLine(log: IMoodLog): string {
  const date = new Date(log.date).toISOString().slice(0, 10);
  const tags = [
    ...(log.tagsPeople ?? []).map((t) => `person:${t}`),
    ...(log.tagsPlaces ?? []).map((t) => `place:${t}`),
    ...(log.tagsEvents ?? []).map((t) => `event:${t}`),
  ].join(', ');

  let sleep: string | null = null;
  if (log.sleepHours != null) {
    sleep = `sleep=${log.sleepHours}h${log.sleepQuality != null ? `(quality ${log.sleepQuality}/5)` : ''}`;
  } else if (log.sleepQuality != null) {
    sleep = `sleepQuality=${log.sleepQuality}/5`;
  }

  let exercise: string | null = null;
  if (log.exercise === true) {
    exercise = `exercise=yes${log.exerciseMinutes != null ? `(${log.exerciseMinutes}min)` : ''}`;
  } else if (log.exercise === false) {
    exercise = 'exercise=no';
  }

  const parts = [
    `[${date}] mood=${log.mood}${log.specificEmotion ? `/${log.specificEmotion}` : ''}`,
    log.intensity != null ? `intensity=${log.intensity}` : null,
    log.energyLevel != null ? `energy=${log.energyLevel}` : null,
    log.stressLevel != null ? `stress=${log.stressLevel}` : null,
    log.anxietyLevel != null ? `anxiety=${log.anxietyLevel}` : null,
    sleep,
    exercise,
    log.socialQuality ? `social=${log.socialQuality}` : null,
    log.moodTriggerCategory ? `trigger=${log.moodTriggerCategory}` : null,
    tags ? `tags=[${tags}]` : null,
    log.notes ? `notes="${log.notes}"` : null,
  ];
  return parts.filter(Boolean).join(' ');
}

function statLines(stats: WeeklyStats): string {
  const line = (label: string, value: number | null, suffix: string) =>
    `- ${label}: ${value != null ? `${value}${suffix}` : 'not recorded'}`;

  const sleep =
    stats.avgSleepHours != null
      ? `- Avg sleep: ${stats.avgSleepHours}h${stats.avgSleepQuality != null ? ` (quality ${stats.avgSleepQuality}/5)` : ''}`
      : line('Avg sleep quality', stats.avgSleepQuality, '/5');

  return [
    line('Avg intensity', stats.avgIntensity, '/10'),
    line('Avg energy', stats.avgEnergyLevel, '/10'),
    line('Avg stress', stats.avgStressLevel, '/10'),
    line('Avg anxiety', stats.avgAnxietyLevel, '/10'),
    sleep,
    `- Exercise days: ${stats.exerciseDays}/${stats.totalLogs}${stats.avgExerciseMinutes != null ? ` (avg ${stats.avgExerciseMinutes}min)` : ''}`,
  ].join('\n');
}

export function buildPrompt(logs: IMoodLog[], stats: WeeklyStats): string {
  const logLines = logs.map(logLine).join('\n');

  return `You are a wellness assistant for MoodMate, a mood tracking app.

Weekly stats (last 7 days, ${stats.totalLogs} entries). Some entries record only the mood; "not recorded" means the user didn't report it, not zero:
${statLines(stats)}

Daily logs:
${logLines}

Provide a brief weekly mood analysis covering:
1. Pattern summary (dominant moods and trends)
2. Key correlations (sleep vs mood, stress/anxiety trends, exercise vs energy, social quality vs mood, trigger patterns) — only where data was recorded
3. One positive observation
4. Two actionable suggestions for the coming week

Rules:
- Keep response under 250 words
- Do not diagnose any condition
- Do not draw conclusions about metrics that were not recorded
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

  const stats = computeWeeklyStats(logs);
  const prompt = buildPrompt(logs, stats);
  const { result: analysis, provider } = await generate(prompt);

  return { status: 'success', analysis: analysis ?? '', stats, provider };
}
