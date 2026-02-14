import { Types } from "mongoose";
import MoodLog from "../models/moodLogModel";
import CustomError from "../utils/customError";
import type {
  CreateMoodLogInput,
  UpdateMoodLogInput,
} from "../validations/moodLogValidation";

interface GetAllMoodsParams {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
  mood?: string;
}

export const createMoodService = async (
  userId: Types.ObjectId,
  data: CreateMoodLogInput
) => {
  const newLog = await MoodLog.create({
    user: userId,
    ...data,
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
  data: UpdateMoodLogInput
) => {
  const log = await MoodLog.findOneAndUpdate(
    { _id: moodId, user: userId },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!log) {
    throw new CustomError("Mood log not found", 404);
  }

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

  const [summary, moodCounts] = await Promise.all([
    MoodLog.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
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
        },
      },
    ]),
    MoodLog.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId),
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$mood",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const moodBreakdown: Record<string, number> = {};
  for (const entry of moodCounts) {
    moodBreakdown[entry._id] = entry.count;
  }

  const stats = summary[0];

  return {
    period: `Last ${days} days`,
    avgIntensity: stats?.avgIntensity?.toFixed(1) || 0,
    avgEnergyLevel: stats?.avgEnergyLevel?.toFixed(1) || 0,
    avgSleepHours: stats?.avgSleepHours?.toFixed(1) || 0,
    avgSleepQuality: stats?.avgSleepQuality?.toFixed(1) || 0,
    totalLogs: stats?.totalLogs || 0,
    moodBreakdown,
  };
};
