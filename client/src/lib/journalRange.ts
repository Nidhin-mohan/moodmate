export type JournalRange = "week" | "month" | "all";

/**
 * Start of a Journal range preset, in local time.
 * "This week" is the same 7 days the dashboard strip shows (today and the 6 days before);
 * "This month" is the calendar month. "All" has no start.
 */
export function rangeStart(range: JournalRange, now = new Date()): Date | undefined {
  if (range === "week") return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return undefined;
}
