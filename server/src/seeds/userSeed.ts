import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/userModel';

const ROLES = ['user', 'user', 'user', 'user', 'therapist', 'admin'] as const;

const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Carol',
  'David',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Iris',
  'Jack',
  'Karen',
  'Liam',
  'Mia',
  'Noah',
  'Olivia',
  'Paul',
  'Quinn',
  'Rachel',
  'Sam',
  'Tina',
  'Uma',
  'Victor',
  'Wendy',
  'Xander',
  'Yara',
  'Zoe',
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Wilson',
  'Moore',
  'Taylor',
  'Anderson',
  'Thomas',
  'Jackson',
  'White',
  'Harris',
  'Martin',
  'Thompson',
  'Young',
  'Walker',
];

const randomItem = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBool = (chance = 0.3) => Math.random() < chance;

// Spread users across the past N days
const randomPastDate = (maxDaysAgo: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, maxDaysAgo));
  d.setHours(randomInt(0, 23), randomInt(0, 59), 0, 0);
  return d;
};

export async function seedUsers(count = 20): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users = Array.from({ length: count }, (_, i) => {
    const first = randomItem(FIRST_NAMES);
    const last = randomItem(LAST_NAMES);
    const role = randomItem(ROLES);
    const isPro = randomBool(0.35);
    const createdAt = randomPastDate(180);
    const proSince = isPro ? randomPastDate(90) : null;

    return {
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      password: passwordHash,
      role,
      isPro,
      proSince,
      isDeleted: false,
      deletedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const result = await User.insertMany(users);
  console.log(`Seeded ${result.length} users`);
  console.log('\nSample credentials (all share same password):');
  console.log('  Password: Password123!');
  result
    .slice(0, 5)
    .forEach((u) => console.log(`  ${u.email}  [${(u as typeof u & { role: string }).role}]`));
}
