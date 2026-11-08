import { describe, expect, it } from "vitest";
import { tagSuggestions } from "./tagSuggestions";

// Newest first, as the list endpoint returns them.
const logs = [
  { tagsPeople: ["mom", "Sam"], tagsPlaces: ["Office"] },
  { tagsPeople: ["Mom"], tagsPlaces: ["office", "Park"] },
  { tagsPeople: ["Alex"], tagsPlaces: [] },
  { tagsPeople: ["Mom", "Alex"] },
];

describe("tagSuggestions", () => {
  it("de-duplicates case-insensitively, showing the most recent spelling", () => {
    const people = tagSuggestions(logs, "people");
    expect(people.filter((t) => t.toLowerCase() === "mom")).toEqual(["mom"]);
  });

  it("ranks by frequency, then recency", () => {
    // Mom ×3, Alex ×2, Sam ×1
    expect(tagSuggestions(logs, "people")).toEqual(["mom", "Alex", "Sam"]);
    // Office ×2 (newest), Park ×1
    expect(tagSuggestions(logs, "places")).toEqual(["Office", "Park"]);
  });

  it("excludes chips already chosen, case-insensitively", () => {
    expect(tagSuggestions(logs, "people", ["MOM"])).toEqual(["Alex", "Sam"]);
  });

  it("caps the list and copes with missing arrays and blank tags", () => {
    expect(tagSuggestions([{ tagsEvents: ["  ", "Run"] }, {}], "events")).toEqual(["Run"]);
    const many = [{ tagsEvents: Array.from({ length: 20 }, (_, i) => `t${i}`) }];
    expect(tagSuggestions(many, "events", [], 5)).toHaveLength(5);
  });
});
