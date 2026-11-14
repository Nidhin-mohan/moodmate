import { computeWeeklyStats } from '../services/weeklyStats';
import { buildPrompt } from '../services/moodAnalysis.service';
import { weeklyAnalysisTemplate } from '../templates/email/weeklyAnalysis';
import type { IMoodLog } from '../models/moodLogModel';

// Plain objects shaped like lean MoodLog documents.
const log = (fields: Partial<IMoodLog>): IMoodLog =>
  ({
    mood: 'Neutral',
    tagsPeople: [],
    tagsPlaces: [],
    tagsEvents: [],
    date: new Date('2026-11-05T10:00:00Z'),
    ...fields,
  }) as IMoodLog;

const full = log({
  mood: 'Happy',
  intensity: 8,
  energyLevel: 6,
  sleepHours: 7,
  sleepQuality: 4,
  exercise: true,
  exerciseMinutes: 30,
  stressLevel: 3,
});

describe('computeWeeklyStats', () => {
  it('averages every field when all logs recorded it', () => {
    const stats = computeWeeklyStats([full, { ...full, intensity: 6 } as IMoodLog]);

    expect(stats.avgIntensity).toBe(7);
    expect(stats.avgEnergyLevel).toBe(6);
    expect(stats.avgSleepHours).toBe(7);
    expect(stats.exerciseDays).toBe(2);
    expect(stats.totalLogs).toBe(2);
  });

  it('averages only over logs that recorded a field', () => {
    const stats = computeWeeklyStats([full, log({ mood: 'Sad' }), log({ mood: 'Sad' })]);

    expect(stats.avgIntensity).toBe(8);
    expect(stats.avgSleepQuality).toBe(4);
    expect(stats.exerciseDays).toBe(1);
    expect(stats.totalLogs).toBe(3);
  });

  it('returns null (never NaN or 0) when no log recorded a field', () => {
    const stats = computeWeeklyStats([log({ mood: 'Sad' }), log({ mood: 'Happy' })]);

    expect(stats.avgIntensity).toBeNull();
    expect(stats.avgEnergyLevel).toBeNull();
    expect(stats.avgSleepHours).toBeNull();
    expect(stats.avgSleepQuality).toBeNull();
    expect(stats.avgStressLevel).toBeNull();
    expect(stats.avgExerciseMinutes).toBeNull();
    expect(stats.exerciseDays).toBe(0);
  });
});

describe('weekly prompt and email with mood-only logs', () => {
  const logs = [full, log({ mood: 'Sad' }), log({ mood: 'Anxious' })];
  const onlyMoods = [log({ mood: 'Sad' }), log({ mood: 'Happy' }), log({ mood: 'Calm' })];

  it('never prints undefined, NaN or a made-up exercise=no in the prompt', () => {
    for (const set of [logs, onlyMoods]) {
      const prompt = buildPrompt(set, computeWeeklyStats(set));
      expect(prompt).not.toMatch(/undefined|NaN|null/);
      expect(prompt).not.toContain('exercise=no');
    }
  });

  it('still prints recorded values, including a real exercise=no', () => {
    const set = [full, log({ mood: 'Sad', exercise: false, intensity: 3 })];
    const prompt = buildPrompt(set, computeWeeklyStats(set));

    expect(prompt).toContain('intensity=8');
    expect(prompt).toContain('intensity=3');
    expect(prompt).toContain('exercise=no');
  });

  it('renders the email without undefined or NaN when averages are missing', () => {
    const html = weeklyAnalysisTemplate({
      name: 'Asha',
      analysis: 'A calm week.',
      stats: computeWeeklyStats(onlyMoods),
    });

    expect(html).not.toMatch(/undefined|NaN|null \//);
    expect(html).not.toContain('Mood Intensity');
  });
});
