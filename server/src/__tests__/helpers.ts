import supertest from 'supertest';
import app from '../app';
import User from '../models/userModel';

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

// Register a user and return the token + user data.
// Used by mood tests that need an authenticated user.
export const createAuthenticatedUser = async (overrides = {}) => {
  const userData = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    ...overrides,
  };

  const res = await request.post('/api/v1/auth/register').send(userData);

  return {
    token: res.body.data.token as string,
    userId: res.body.data.userId as string,
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
