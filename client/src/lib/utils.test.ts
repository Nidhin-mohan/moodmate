import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("lets a later Tailwind class override a conflicting earlier one", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("drops falsy conditional classes", () => {
    const classesFor = (hidden: boolean) => cn("base", hidden && "hidden", undefined, "end");
    expect(classesFor(false)).toBe("base end");
    expect(classesFor(true)).toBe("base hidden end");
  });
});
