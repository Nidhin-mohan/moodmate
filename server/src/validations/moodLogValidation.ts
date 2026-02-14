import { z } from "zod";

export const createMoodLogSchema = z.object({
  mood: z.string().min(1, "Mood is required"),
  specificEmotion: z.string().optional(),
  intensity: z.number().int().min(1).max(10),
  energyLevel: z.number().int().min(1).max(10),
  tagsPeople: z.array(z.string()).default([]),
  tagsPlaces: z.array(z.string()).default([]),
  tagsEvents: z.array(z.string()).default([]),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().int().min(1).max(5),
  exercise: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
  reflections: z.string().max(2000).optional(),
  date: z.coerce.date().optional(),
});

export const updateMoodLogSchema = createMoodLogSchema.partial();

export type CreateMoodLogInput = z.infer<typeof createMoodLogSchema>;
export type UpdateMoodLogInput = z.infer<typeof updateMoodLogSchema>;
