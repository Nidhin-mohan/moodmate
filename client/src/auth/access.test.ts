import { describe, expect, it } from "vitest";
import { canAccess, routeDecision } from "./access";

describe("canAccess", () => {
  it.each([
    // role, allowed, expected
    ["public", ["public"], true],
    ["public", ["user"], false],
    ["user", ["user"], true],
    ["user", ["admin"], false],
    ["therapist", ["user"], true],
    ["therapist", ["admin"], false],
    ["admin", ["user"], true],
    ["admin", ["admin"], true],
  ] as const)("%s on %j → %s", (role, allowed, expected) => {
    expect(canAccess(role, [...allowed])).toBe(expected);
  });
});

describe("routeDecision", () => {
  it("lets anyone through to public routes", () => {
    expect(routeDecision(false, undefined, ["public"])).toBe("allow");
  });

  it("sends a logged-out visitor on a protected route to login, not unauthorized", () => {
    expect(routeDecision(false, undefined, ["user"])).toBe("login");
    expect(routeDecision(false, undefined, ["admin"])).toBe("login");
  });

  it("sends a logged-in user without the role to unauthorized", () => {
    expect(routeDecision(true, "user", ["admin"])).toBe("unauthorized");
    expect(routeDecision(true, "therapist", ["admin"])).toBe("unauthorized");
  });

  it("lets therapists use the regular user pages", () => {
    expect(routeDecision(true, "therapist", ["user"])).toBe("allow");
  });

  it("treats a logged-in session with no stored role as a user", () => {
    expect(routeDecision(true, undefined, ["user"])).toBe("allow");
  });
});
