import { describe, expect, it } from "vitest";
import { MOODS, isLowMood, resolveMood, toolsGroupFor } from "./moods";

describe("mood catalogue", () => {
  it("offers exactly the six quick-log moods, in picker order", () => {
    expect(MOODS).toEqual(["Happy", "Excited", "Neutral", "Sad", "Anxious", "Angry"]);
  });

  it("resolves stored moods case-insensitively", () => {
    expect(resolveMood("sad").key).toBe("Sad");
    expect(resolveMood("  ANXIOUS ").key).toBe("Anxious");
    expect(resolveMood("Happy").label).toBe("Happy");
  });

  it("falls back for unknown moods, keeping their own label", () => {
    const calm = resolveMood("calm");
    expect(calm.known).toBe(false);
    expect(calm.key).toBe("other");
    expect(calm.label).toBe("Calm");
  });

  it("classifies only Sad, Anxious and Angry as low, whatever the case", () => {
    expect(isLowMood("Sad")).toBe(true);
    expect(isLowMood("anxious")).toBe(true);
    expect(isLowMood("ANGRY")).toBe(true);
    expect(isLowMood("Happy")).toBe(false);
    expect(isLowMood("Neutral")).toBe(false);
    expect(isLowMood("tired")).toBe(false);
    expect(isLowMood("")).toBe(false);
  });

  it("maps low moods to the matching Tools group", () => {
    expect(toolsGroupFor("Anxious")).toBe("calm");
    expect(toolsGroupFor("angry")).toBe("calm");
    expect(toolsGroupFor("Sad")).toBe("kind");
    expect(toolsGroupFor("Happy")).toBeNull();
    expect(toolsGroupFor("tired")).toBeNull();
  });
});
