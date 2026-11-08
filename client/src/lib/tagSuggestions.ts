export type TagKind = "people" | "places" | "events";

type TaggedLog = { tagsPeople?: string[]; tagsPlaces?: string[]; tagsEvents?: string[] };

const FIELD: Record<TagKind, keyof TaggedLog> = {
  people: "tagsPeople",
  places: "tagsPlaces",
  events: "tagsEvents",
};

/**
 * Suggestions for a chip input, from the user's past logs (newest first).
 * Case-insensitive de-duplication keeps the most recent spelling, so "mom" and
 * "Mom" stay one tag; ranked by how often it's used, then how recently.
 */
export function tagSuggestions(
  logs: TaggedLog[],
  kind: TagKind,
  chosen: string[] = [],
  limit = 8
): string[] {
  const taken = new Set(chosen.map((c) => c.trim().toLowerCase()));
  const stats = new Map<string, { label: string; count: number; firstSeen: number }>();
  let order = 0;

  for (const log of logs) {
    for (const raw of log[FIELD[kind]] ?? []) {
      const label = raw.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      const entry = stats.get(key);
      if (entry) entry.count += 1;
      else stats.set(key, { label, count: 1, firstSeen: order++ });
    }
  }

  return [...stats.entries()]
    .filter(([key]) => !taken.has(key))
    .sort(([, a], [, b]) => b.count - a.count || a.firstSeen - b.firstSeen)
    .slice(0, limit)
    .map(([, v]) => v.label);
}
