/**
 * Master seed entry point
 *
 * Usage: npm run seed
 *
 * Comment/uncomment the calls below to control what gets seeded.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedUsers } from './userSeed';
import { seedMoodLogs } from './moodSeed';

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // ── Seed users ───────────────────────────────────────────────
  await seedUsers(20);

  // ── Seed mood logs (paste a real userId) ────────────────────
  // await seedMoodLogs('<userId>', 60);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
