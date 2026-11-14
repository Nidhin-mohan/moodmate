/**
 * The mood catalogue — the single source of truth for every mood the app
 * renders or classifies. The quick log only offers MOODS; stored data can hold
 * any string (legacy / seeded "calm", "tired"…), which resolves to a fallback
 * that keeps its own label and is never treated as low.
 */

export const MOODS = ["Happy", "Excited", "Neutral", "Sad", "Anxious", "Angry"] as const;
export type MoodName = (typeof MOODS)[number];

/** Tools groups, by how the user feels. */
export type ToolsGroup = "calm" | "scattered" | "kind";

export interface MoodInfo {
  key: MoodName | "other";
  label: string;
  known: boolean;
  low: boolean;
  /** HSL hue and saturation used to tint the face and the mood dots. */
  hue: number;
  sat: number;
  toolsGroup: ToolsGroup | null;
}

const CATALOGUE: Record<MoodName, Omit<MoodInfo, "key" | "label" | "known">> = {
  Happy: { low: false, hue: 45, sat: 85, toolsGroup: null },
  Excited: { low: false, hue: 22, sat: 85, toolsGroup: null },
  Neutral: { low: false, hue: 35, sat: 14, toolsGroup: null },
  Sad: { low: true, hue: 212, sat: 60, toolsGroup: "kind" },
  Anxious: { low: true, hue: 268, sat: 45, toolsGroup: "calm" },
  Angry: { low: true, hue: 4, sat: 65, toolsGroup: "calm" },
};

const BY_LOWER = new Map<string, MoodName>(MOODS.map((m) => [m.toLowerCase(), m]));

const capitalise = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s);

export function resolveMood(raw: string | null | undefined): MoodInfo {
  const trimmed = (raw ?? "").trim();
  const name = BY_LOWER.get(trimmed.toLowerCase());
  if (name) return { key: name, label: name, known: true, ...CATALOGUE[name] };
  return {
    key: "other",
    label: capitalise(trimmed) || "Unknown",
    known: false,
    low: false,
    hue: 262,
    sat: 8,
    toolsGroup: null,
  };
}

export const isLowMood = (raw: string | null | undefined) => resolveMood(raw).low;

export const toolsGroupFor = (raw: string | null | undefined) => resolveMood(raw).toolsGroup;

export type ThemeMode = "light" | "dark";

/** Face fill (tint) and feature stroke (ink) for a mood in a theme. */
export function moodColors(raw: string | null | undefined, mode: ThemeMode) {
  const { hue: h, sat: s } = resolveMood(raw);
  return mode === "light"
    ? { tint: `hsl(${h} ${s}% 82%)`, ink: `hsl(${h} ${Math.min(s, 40)}% 22%)` }
    : { tint: `hsl(${h} ${Math.round(s * 0.6)}% 62%)`, ink: `hsl(${h} 30% 10%)` };
}
