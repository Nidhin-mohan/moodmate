const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// "Today, 9:30 AM" / "Yesterday, 8:05 PM" / "Mar 14, 10:00 AM" / "Dec 31, 2025, 10:00 AM".
// The year is shown whenever it isn't the current one, so an odd date is never ambiguous.
export function formatActivityDate(value: string | Date, now: Date = new Date()): string {
  const date = new Date(value);
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (dayDiff === 0) return `Today, ${time(date)}`;
  if (dayDiff === 1) return `Yesterday, ${time(date)}`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}
