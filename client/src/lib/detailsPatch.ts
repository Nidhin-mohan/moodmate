import type { MoodLog, MoodLogPatch } from "@/services/moodLogService";

const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);

/**
 * The update sent by "Add details": only fields that are still empty on the
 * saved entry AND answered in the draft. Never the mood, never a field that
 * already has a value — so a saved log is filled in, never rewritten.
 * Tags are stored as [] on create, so an empty array counts as empty.
 */
export function detailsPatch(saved: MoodLog, draft: MoodLogPatch): MoodLogPatch {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (key === "mood" || key === "date") continue;
    if (isEmpty(value)) continue;
    if (!isEmpty(saved[key as keyof MoodLog])) continue;
    patch[key] = typeof value === "string" ? value.trim() : value;
  }
  return patch as MoodLogPatch;
}
