import { describe, expect, it } from "vitest";
import { rangeStart } from "./journalRange";

// Months are 0-based: 10 = November.
const now = new Date(2026, 10, 14, 15, 30);

describe("rangeStart", () => {
  it("starts 'This week' at midnight six days before today, like the dashboard strip", () => {
    expect(rangeStart("week", now)).toEqual(new Date(2026, 10, 8));
  });

  it("starts 'This month' on the 1st of the calendar month, not 30 days back", () => {
    expect(rangeStart("month", now)).toEqual(new Date(2026, 10, 1));
  });

  it("crosses a month boundary for 'This week' early in the month", () => {
    expect(rangeStart("week", new Date(2026, 11, 3, 9))).toEqual(new Date(2026, 10, 27));
  });

  it("has no start for 'All'", () => {
    expect(rangeStart("all", now)).toBeUndefined();
  });
});
