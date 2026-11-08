import { describe, expect, it } from "vitest";
import { weekSummary } from "./weekSummary";

// Sunday 8 Nov 2026, local time.
const today = new Date(2026, 10, 8, 18, 0);
const at = (day: number, hour = 12) => new Date(2026, 10, day, hour).toISOString();

describe("weekSummary", () => {
  it("returns the 7 days ending today, oldest first, with today flagged", () => {
    const { days } = weekSummary([], today);

    expect(days).toHaveLength(7);
    expect(days[0].date.getDate()).toBe(2);
    expect(days[6].date.getDate()).toBe(8);
    expect(days.map((d) => d.isToday)).toEqual([false, false, false, false, false, false, true]);
    expect(days.map((d) => d.label)).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
  });

  it("leaves days without a check-in empty", () => {
    const { days } = weekSummary([{ mood: "Happy", date: at(4) }], today);

    expect(days.map((d) => d.mood)).toEqual([null, null, "Happy", null, null, null, null]);
  });

  it("uses the latest mood when a day has several check-ins", () => {
    const { days } = weekSummary(
      [
        { mood: "Sad", date: at(5, 9) },
        { mood: "Happy", date: at(5, 21) },
        { mood: "Neutral", date: at(5, 14) },
      ],
      today
    );

    expect(days[3].mood).toBe("Happy");
  });

  it("ignores check-ins outside the window", () => {
    const summary = weekSummary(
      [
        { mood: "Sad", date: at(1) },
        { mood: "Happy", date: at(8) },
      ],
      today
    );

    expect(summary.count).toBe(1);
  });

  it("has a gentle zero-entry variant", () => {
    const summary = weekSummary([], today);

    expect(summary.count).toBe(0);
    expect(summary.sentence).toMatch(/no check-ins yet this week/i);
  });

  it("describes the tone of the week in one sentence", () => {
    const logs = (moods: string[]) => moods.map((mood, i) => ({ mood, date: at(2 + i) }));

    expect(weekSummary(logs(["Happy", "Excited", "Happy", "Neutral"]), today).sentence).toBe(
      "You've checked in 4 times this week. Mostly bright days."
    );
    expect(weekSummary(logs(["Sad", "Anxious", "Happy"]), today).sentence).toMatch(
      /^You've checked in 3 times this week\. It's been a heavier week/
    );
    expect(weekSummary(logs(["Neutral", "neutral", "calm"]), today).sentence).toBe(
      "You've checked in 3 times this week. Mostly steady."
    );
    expect(weekSummary(logs(["Happy", "Sad", "Neutral", "Excited", "Neutral"]), today).sentence).toBe(
      "You've checked in 5 times this week. A mix of moods, and that's okay."
    );
    expect(weekSummary(logs(["Happy"]), today).sentence).toMatch(/^You've checked in once this week\./);
  });
});
