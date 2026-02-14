import mongoose from "mongoose";
import MoodLog from "../models/moodLogModel";
import dotenv from "dotenv";

dotenv.config();

// Seed data configuration
const moods = ["happy", "sad", "anxious", "calm", "angry", "excited", "tired", "neutral"];

const specificEmotions: Record<string, string[]> = {
  happy: ["joyful", "content", "grateful", "optimistic"],
  sad: ["lonely", "disappointed", "melancholic", "grief"],
  anxious: ["worried", "nervous", "stressed", "overwhelmed"],
  calm: ["peaceful", "relaxed", "serene", "balanced"],
  angry: ["frustrated", "irritated", "resentful", "annoyed"],
  excited: ["enthusiastic", "eager", "thrilled", "energized"],
  tired: ["exhausted", "drained", "fatigued", "sleepy"],
  neutral: ["indifferent", "meh", "okay", "stable"],
};

const people = ["family", "friends", "coworkers", "partner", "alone", "strangers"];
const places = ["home", "office", "outdoors", "gym", "cafe", "commute", "park"];
const events = ["work", "exercise", "social", "meeting", "meal", "hobby", "rest", "travel"];

const notes = [
  "Had a productive day today.",
  "Feeling a bit off, not sure why.",
  "Great workout session this morning.",
  "Work was stressful but manageable.",
  "Spent quality time with family.",
  "Didn't sleep well last night.",
  "Meditation helped clear my mind.",
  "Felt overwhelmed with deadlines.",
  "Nice weather lifted my mood.",
  "Had a difficult conversation today.",
  "",
];

const reflections = [
  "I should focus more on self-care.",
  "Grateful for the small wins today.",
  "Need to set better boundaries.",
  "Tomorrow will be better.",
  "I handled that situation well.",
  "Should get more sleep tonight.",
  "Exercise really helps my mood.",
  "I need to reach out to friends more.",
  "Taking things one step at a time.",
  "",
];

// Helpers
const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number, decimals = 1): number =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomSubset = <T>(arr: T[], max: number): T[] => {
  const count = randomInt(0, max);
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateMoodLog = (userId: string, date: Date) => {
  const mood = randomItem(moods);
  const emotions = specificEmotions[mood] || [];

  return {
    user: new mongoose.Types.ObjectId(userId),
    mood,
    specificEmotion: emotions.length ? randomItem(emotions) : undefined,
    intensity: randomInt(1, 10),
    energyLevel: randomInt(1, 10),
    tagsPeople: randomSubset(people, 3),
    tagsPlaces: randomSubset(places, 2),
    tagsEvents: randomSubset(events, 3),
    sleepHours: randomFloat(4, 10),
    sleepQuality: randomInt(1, 5),
    exercise: Math.random() > 0.5,
    notes: randomItem(notes) || undefined,
    reflections: randomItem(reflections) || undefined,
    date,
  };
};

// Main seed function
export const seedMoodLogs = async (
  userId: string,
  days: number = 60,
  logsPerDay: { min: number; max: number } = { min: 1, max: 3 }
): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to MongoDB");

    // Optional: Clear existing logs for this user
    // await MoodLog.deleteMany({ user: userId });
    // console.log("Cleared existing mood logs");

    const logs = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const logsForDay = randomInt(logsPerDay.min, logsPerDay.max);

      for (let j = 0; j < logsForDay; j++) {
        // Randomize time of day
        const logDate = new Date(date);
        logDate.setHours(randomInt(6, 23), randomInt(0, 59), 0, 0);

        logs.push(generateMoodLog(userId, logDate));
      }
    }

    const result = await MoodLog.insertMany(logs);
    console.log(`Seeded ${result.length} mood logs for user ${userId}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

// Run directly: npx ts-node seeds/moodSeed.ts <userId>
const userId = process.argv[2];

if (!userId) {
  console.error("Usage: npx ts-node seeds/moodSeed.ts <userId>");
  process.exit(1);
}

seedMoodLogs(userId, 60, { min: 1, max: 2 });