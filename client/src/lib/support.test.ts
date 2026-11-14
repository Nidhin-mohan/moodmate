import { describe, expect, it } from "vitest";
import { MOODS } from "./moods";
import { supportLevel } from "./support";

describe("supportLevel", () => {
  const low = ["Sad", "Anxious", "Angry"];
  const notLow = MOODS.filter((m) => !low.includes(m));

  it.each(notLow)("never offers support for %s, at any intensity", (mood) => {
    expect(supportLevel(mood)).toBe("none");
    expect(supportLevel(mood, 3)).toBe("none");
    expect(supportLevel(mood, 10)).toBe("none");
  });

  it.each(low)("gives a light nudge for a quick %s log with no intensity", (mood) => {
    expect(supportLevel(mood)).toBe("nudge");
    expect(supportLevel(mood, null)).toBe("nudge");
  });

  it.each(low)("gives a nudge for %s below intensity 7", (mood) => {
    expect(supportLevel(mood, 1)).toBe("nudge");
    expect(supportLevel(mood, 6)).toBe("nudge");
  });

  it.each(low)("offers full support for %s at intensity 7 or above", (mood) => {
    expect(supportLevel(mood, 7)).toBe("full");
    expect(supportLevel(mood, 10)).toBe("full");
  });

  it("matches stored moods case-insensitively and never treats unknown moods as low", () => {
    expect(supportLevel("sad", 8)).toBe("full");
    expect(supportLevel("tired", 9)).toBe("none");
    expect(supportLevel("calm")).toBe("none");
  });
});
