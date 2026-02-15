import supertest from "supertest";
import app from "../app";

export const request = supertest(app);

// Register a user and return the token + user data.
// Used by mood tests that need an authenticated user.
export const createAuthenticatedUser = async (overrides = {}) => {
  const userData = {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    password: "password123",
    ...overrides,
  };

  const res = await request
    .post("/api/v1/auth/register")
    .send(userData);

  return {
    token: res.body.data.token as string,
    userId: res.body.data.userId as string,
    ...userData,
  };
};

// Valid mood log payload for creating mood logs in tests.
export const validMoodLog = {
  mood: "happy",
  specificEmotion: "joyful",
  intensity: 7,
  energyLevel: 8,
  tagsPeople: ["family"],
  tagsPlaces: ["home"],
  tagsEvents: ["dinner"],
  sleepHours: 7.5,
  sleepQuality: 4,
  exercise: true,
  notes: "Great day",
};
