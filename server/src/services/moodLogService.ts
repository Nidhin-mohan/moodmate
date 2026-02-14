import { Types } from "mongoose";
import MoodLog from "../models/moodLogModel";
import CustomError from "../utils/custumeError";

const toArray = (str: string | undefined): string[] =>
  str ? str.split(",").map((s) => s.trim()).filter((s) => s) : [];

interface CreateMoodData {
  mood: string;
  specificEmotion?: string;
  intensity?: number;
  energyLevel?: number;
  tagsPeople?: string[] | string;
  tagsPlaces?: string[] | string;
  tagsEvents?: string[] | string;
  sleepHours?: number;
  sleepQuality?: number;
  exercise?: boolean;
  notes?: string;
  reflections?: string;
  date?: Date;
}

interface GetAllMoodsParams {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  mood?: string;
}

export const createMoodService = async (
  userId: Types.ObjectId,
  data: CreateMoodData
) => {
  const newLog = await MoodLog.create({
    user: userId,
    mood: data.mood,
    specificEmotion: data.specificEmotion,
    intensity: data.intensity,
    energyLevel: data.energyLevel,
    tagsPeople: Array.isArray(data.tagsPeople) ? data.tagsPeople : toArray(data.tagsPeople as string),
    tagsPlaces: Array.isArray(data.tagsPlaces) ? data.tagsPlaces : toArray(data.tagsPlaces as string),
    tagsEvents: Array.isArray(data.tagsEvents) ? data.tagsEvents : toArray(data.tagsEvents as string),
    sleepHours: data.sleepHours,
    sleepQuality: data.sleepQuality,
    exercise: data.exercise,
    notes: data.notes,
    reflections: data.reflections,
    date: data.date || new Date(),
  });

  return newLog;
};

export const getAllMoodsService = async (
  userId: Types.ObjectId,
  params: GetAllMoodsParams
) => {
  const { page, limit, startDate, endDate, mood } = params;
  const skip = (page - 1) * limit;

  const filter: any = { user: userId };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (mood) {
    filter.mood = mood;
  }

  const [logs, total] = await Promise.all([
    MoodLog.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    MoodLog.countDocuments(filter),
  ]);

  return {
    count: logs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: logs,
  };
};

export const getMoodByIdService = async (
  moodId: string,
  userId: Types.ObjectId
) => {
  const log = await MoodLog.findOne({ _id: moodId, user: userId });

  if (!log) {
    throw new CustomError("Mood log not found", 404);
  }

  return log;
};

export const updateMoodService = async (
  moodId: string,
  userId: Types.ObjectId,
  data: Partial<CreateMoodData>
) => {
  const log = await MoodLog.findOne({ _id: moodId, user: userId });

  if (!log) {
    throw new CustomError("Mood log not found", 404);
  }

  const allowedFields = [
    "mood",
    "specificEmotion",
    "intensity",
    "energyLevel",
    "tagsPeople",
    "tagsPlaces",
    "tagsEvents",
    "sleepHours",
    "sleepQuality",
    "exercise",
    "notes",
    "reflections",
    "date",
  ];

  allowedFields.forEach((field) => {
    if ((data as any)[field] !== undefined) {
      if (["tagsPeople", "tagsPlaces", "tagsEvents"].includes(field)) {
        const value = (data as any)[field];
        (log as any)[field] = Array.isArray(value) ? value : toArray(value);
      } else {
        (log as any)[field] = (data as any)[field];
      }
    }
  });

  await log.save();
  return log;
};

export const deleteMoodService = async (
  moodId: string,
  userId: Types.ObjectId
) => {
  const log = await MoodLog.findOneAndDelete({ _id: moodId, user: userId });

  if (!log) {
    throw new CustomError("Mood log not found", 404);
  }

  return log;
};

export const getMoodStatsService = async (
  userId: Types.ObjectId,
  days: number
) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await MoodLog.aggregate([
    {
      $match: {
        user: userId,
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        avgIntensity: { $avg: "$intensity" },
        avgEnergyLevel: { $avg: "$energyLevel" },
        avgSleepHours: { $avg: "$sleepHours" },
        avgSleepQuality: { $avg: "$sleepQuality" },
        totalLogs: { $sum: 1 },
        moodCounts: { $push: "$mood" },
      },
    },
  ]);

  let moodBreakdown: Record<string, number> = {};
  if (stats.length > 0 && stats[0].moodCounts) {
    moodBreakdown = stats[0].moodCounts.reduce(
      (acc: Record<string, number>, mood: string) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      },
      {}
    );
  }

  return {
    period: `Last ${days} days`,
    avgIntensity: stats[0]?.avgIntensity?.toFixed(1) || 0,
    avgEnergyLevel: stats[0]?.avgEnergyLevel?.toFixed(1) || 0,
    avgSleepHours: stats[0]?.avgSleepHours?.toFixed(1) || 0,
    avgSleepQuality: stats[0]?.avgSleepQuality?.toFixed(1) || 0,
    totalLogs: stats[0]?.totalLogs || 0,
    moodBreakdown,
  };
};
