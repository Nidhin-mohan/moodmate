import { describe, expect, it } from "vitest";
import { formatActivityDate } from "./formatActivityDate";

const now = new Date("2026-11-08T15:00:00");

describe("formatActivityDate", () => {
  it("says Today for the same day", () => {
    expect(formatActivityDate("2026-11-08T09:30:00", now)).toMatch(/^Today, 9:30\sAM$/);
  });

  it("says Yesterday for the previous day", () => {
    expect(formatActivityDate("2026-11-07T20:05:00", now)).toMatch(/^Yesterday, 8:05\sPM$/);
  });

  it("omits the year for older dates in the current year", () => {
    expect(formatActivityDate("2026-03-14T10:00:00", now)).not.toMatch(/2026/);
  });

  it("includes the year for dates in another year", () => {
    expect(formatActivityDate("2025-12-31T10:00:00", now)).toMatch(/2025/);
    expect(formatActivityDate("2999-01-01T10:00:00", now)).toMatch(/2999/);
  });
});
