import { z } from 'zod';

const socialQualityEnum = z.enum(['isolated', 'neutral', 'connected']);
const moodTriggerCategoryEnum = z.enum([
  'work',
  'relationships',
  'health',
  'finances',
  'environment',
  'random',
]);

export const createMoodLogSchema = z.object({
  mood: z.string().min(1, 'Mood is required'),
  specificEmotion: z.string().optional(),
  intensity: z.number().int().min(1).max(10),
  energyLevel: z.number().int().min(1).max(10),
  stressLevel: z.number().int().min(1).max(10).optional(),
  anxietyLevel: z.number().int().min(1).max(10).optional(),
  tagsPeople: z.array(z.string()).default([]),
  tagsPlaces: z.array(z.string()).default([]),
  tagsEvents: z.array(z.string()).default([]),
  socialQuality: socialQualityEnum.optional(),
  moodTriggerCategory: moodTriggerCategoryEnum.optional(),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().int().min(1).max(5),
  exercise: z.boolean().default(false),
  exerciseMinutes: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
  reflections: z.string().max(2000).optional(),
  // A day of slack so "now" in the user's timezone is never rejected.
  date: z.coerce
    .date()
    .refine((d) => d.getTime() <= Date.now() + 24 * 60 * 60 * 1000, {
      message: 'Date cannot be in the future',
    })
    .optional(),
});

export const updateMoodLogSchema = createMoodLogSchema.partial();

export type CreateMoodLogInput = z.infer<typeof createMoodLogSchema>;
export type UpdateMoodLogInput = z.infer<typeof updateMoodLogSchema>;

// ── Query strings ─────────────────────────────────────────────
// Express hands over string | string[] | object; anything that isn't a plain
// scalar (e.g. mood[$ne]=x) fails here instead of reaching MongoDB.

export const listMoodsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  mood: z.string().min(1).optional(),
});

export const moodStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export type ListMoodsQuery = z.infer<typeof listMoodsQuerySchema>;
