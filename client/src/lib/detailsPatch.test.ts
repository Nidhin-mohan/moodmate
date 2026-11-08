import { describe, expect, it } from "vitest";
import { detailsPatch } from "./detailsPatch";
import type { MoodLog } from "@/services/moodLogService";

const saved = (fields: Partial<MoodLog> = {}): MoodLog => ({
  _id: "1",
  user: "u",
  mood: "Sad",
  tagsPeople: [],
  tagsPlaces: [],
  tagsEvents: [],
  createdAt: "",
  updatedAt: "",
  ...fields,
});

describe("detailsPatch", () => {
  it("includes answered fields that are empty on the saved entry", () => {
    expect(detailsPatch(saved(), { intensity: 8, sleepHours: 6 })).toEqual({
      intensity: 8,
      sleepHours: 6,
    });
  });

  it("treats an empty tag array as empty, so chips can be added", () => {
    expect(detailsPatch(saved(), { tagsPeople: ["Mom"] })).toEqual({ tagsPeople: ["Mom"] });
  });

  it("never overwrites a field that is already set", () => {
    const patch = detailsPatch(saved({ intensity: 3, tagsPeople: ["Sam"] }), {
      intensity: 9,
      tagsPeople: ["Mom"],
      energyLevel: 4,
    });
    expect(patch).toEqual({ energyLevel: 4 });
  });

  it("never sends mood", () => {
    expect(detailsPatch(saved(), { mood: "Happy" } as never)).toEqual({});
  });

  it("drops unanswered draft values: undefined, null, blank strings and empty arrays", () => {
    expect(
      detailsPatch(saved(), {
        intensity: undefined,
        notes: "   ",
        tagsEvents: [],
        sleepQuality: null as never,
      })
    ).toEqual({});
  });

  it("keeps a real false and zero (they are answers)", () => {
    expect(detailsPatch(saved(), { exercise: false, sleepHours: 0 })).toEqual({
      exercise: false,
      sleepHours: 0,
    });
  });

  it("trims text answers", () => {
    expect(detailsPatch(saved(), { notes: "  long day  " })).toEqual({ notes: "long day" });
  });
});
