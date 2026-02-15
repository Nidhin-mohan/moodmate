import {
  createMoodLogSchema,
  updateMoodLogSchema,
} from "../validations/moodLogValidation";
import { registerSchema, loginSchema } from "../validations/userValidation";

// These are unit tests — no DB, no HTTP, no setup needed.
// They test that the Zod schemas accept valid data and
// reject invalid data with the right error messages.

describe("User Validation Schemas", () => {
  describe("registerSchema", () => {
    it("accepts valid registration data", () => {
      const result = registerSchema.safeParse({
        name: "John",
        email: "john@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = registerSchema.safeParse({
        name: "",
        email: "john@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = registerSchema.safeParse({
        name: "John",
        email: "not-an-email",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });

    it("rejects password shorter than 6 characters", () => {
      const result = registerSchema.safeParse({
        name: "John",
        email: "john@example.com",
        password: "12345",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password");
      }
    });
  });

  describe("loginSchema", () => {
    it("accepts valid login data", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
    });
  });
});

describe("Mood Log Validation Schemas", () => {
  const validData = {
    mood: "happy",
    intensity: 7,
    energyLevel: 8,
    sleepHours: 7.5,
    sleepQuality: 4,
  };

  describe("createMoodLogSchema", () => {
    it("accepts valid mood log with required fields only", () => {
      const result = createMoodLogSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        // Defaults should be applied
        expect(result.data.tagsPeople).toEqual([]);
        expect(result.data.exercise).toBe(false);
      }
    });

    it("accepts valid mood log with all fields", () => {
      const result = createMoodLogSchema.safeParse({
        ...validData,
        specificEmotion: "joyful",
        tagsPeople: ["family"],
        tagsPlaces: ["home"],
        tagsEvents: ["dinner"],
        exercise: true,
        notes: "Great day",
        reflections: "Feeling grateful",
        date: "2025-01-15",
      });

      expect(result.success).toBe(true);
    });

    it("rejects intensity below 1", () => {
      const result = createMoodLogSchema.safeParse({
        ...validData,
        intensity: 0,
      });

      expect(result.success).toBe(false);
    });

    it("rejects intensity above 10", () => {
      const result = createMoodLogSchema.safeParse({
        ...validData,
        intensity: 11,
      });

      expect(result.success).toBe(false);
    });

    it("rejects non-integer intensity", () => {
      const result = createMoodLogSchema.safeParse({
        ...validData,
        intensity: 7.5,
      });

      expect(result.success).toBe(false);
    });

    it("rejects sleepHours above 24", () => {
      const result = createMoodLogSchema.safeParse({
        ...validData,
        sleepHours: 25,
      });

      expect(result.success).toBe(false);
    });

    it("rejects sleepQuality above 5", () => {
      const result = createMoodLogSchema.safeParse({
        ...validData,
        sleepQuality: 6,
      });

      expect(result.success).toBe(false);
    });

    it("rejects empty mood string", () => {
      const result = createMoodLogSchema.safeParse({
        ...validData,
        mood: "",
      });

      expect(result.success).toBe(false);
    });

    it("rejects notes longer than 2000 characters", () => {
      const result = createMoodLogSchema.safeParse({
        ...validData,
        notes: "a".repeat(2001),
      });

      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const result = createMoodLogSchema.safeParse({
        mood: "happy",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain("intensity");
        expect(paths).toContain("energyLevel");
        expect(paths).toContain("sleepHours");
        expect(paths).toContain("sleepQuality");
      }
    });
  });

  describe("updateMoodLogSchema", () => {
    it("accepts partial update (single field)", () => {
      const result = updateMoodLogSchema.safeParse({
        mood: "calm",
      });

      expect(result.success).toBe(true);
    });

    it("accepts empty object (no changes)", () => {
      const result = updateMoodLogSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it("still validates field constraints on partial update", () => {
      const result = updateMoodLogSchema.safeParse({
        intensity: 999,
      });

      expect(result.success).toBe(false);
    });
  });
});
