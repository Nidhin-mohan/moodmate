import supertest from 'supertest';
import app from '../app';
import User from '../models/userModel';
import { generateToken } from '../config/jwt';

export const request = supertest(app);

// Promote an existing user straight in the DB (there is no API path to the first admin).
export const makeAdmin = async (userId: string) => {
  await User.updateOne({ _id: userId }, { $set: { role: 'admin' } });
};

// Register a user, promote them to admin, and return their credentials.
export const createAdminUser = async (overrides = {}) => {
  const admin = await createAuthenticatedUser({
    email: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
    ...overrides,
  });
  await makeAdmin(admin.userId);
  return admin;
};

// Create a user and return a valid token + user data.
// Inserts straight into the DB and signs the token directly rather than calling
// /auth/register, so tests that need many users don't trip the auth rate limiter.
// Tests of registration itself call the endpoint explicitly.
let userSeq = 0;
export const createAuthenticatedUser = async (overrides = {}) => {
  userSeq += 1;
  const userData = {
    name: 'Test User',
    email: `test-${Date.now()}-${userSeq}@example.com`,
    password: 'password123',
    ...overrides,
  };

  const user = await User.create(userData);
  const userId = user._id.toString();

  return {
    token: await generateToken(userId),
    userId,
    ...userData,
  };
};

// Valid mood log payload for creating mood logs in tests.
export const validMoodLog = {
  mood: 'happy',
  specificEmotion: 'joyful',
  intensity: 7,
  energyLevel: 8,
  tagsPeople: ['family'],
  tagsPlaces: ['home'],
  tagsEvents: ['dinner'],
  sleepHours: 7.5,
  sleepQuality: 4,
  exercise: true,
  notes: 'Great day',
};
