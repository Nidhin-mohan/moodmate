import { isLowMood } from "./moods";

export type SupportLevel = "none" | "nudge" | "full";

/** Intensity at or above which a low mood gets the full support screen. */
export const FULL_SUPPORT_INTENSITY = 7;

/**
 * What support to offer after a log.
 * - not a low mood → none
 * - low mood, intensity unknown or below 7 → nudge (1-minute breather, no helplines)
 * - low mood, intensity ≥ 7 → full (grounding + helplines)
 */
export function supportLevel(mood: string, intensity?: number | null): SupportLevel {
  if (!isLowMood(mood)) return "none";
  if (intensity != null && intensity >= FULL_SUPPORT_INTENSITY) return "full";
  return "nudge";
}
