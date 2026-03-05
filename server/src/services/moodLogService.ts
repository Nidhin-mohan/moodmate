import { IMoodLog } from "../models/moodLogModel";
import { NotFoundError } from "../utils/customError";
import { moodLogRepository, MoodLogFilter } from "../repositories/moodLogRepository";
import type { QueryOptions } from "../repositories/types";
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

interface PaginatedMoodResult {
  count: number;
  total: number;
  page: number;
  pages: number;
  data: IMoodLog[];
}

interface MoodStats {
  period: string;
  avgIntensity: string | number;
  avgEnergyLevel: string | number;
  avgSleepHours: string | number;
  avgSleepQuality: string | number;
  totalLogs: number;
  moodBreakdown: Record<string, number>;
}

export const createMoodService = async (
  userId: string,
  data: CreateMoodLogInput
): Promise<IMoodLog> => {
  return moodLogRepository.create({
    user: userId,
    ...data,
    date: data.date || new Date(),
  } as any);
};

export const getAllMoodsService = async (
  userId: string,
  params: GetAllMoodsParams
): Promise<PaginatedMoodResult> => {
  const { page, limit, startDate, endDate, mood } = params;
  const skip = (page - 1) * limit;

  // Build typed filter — service says WHAT it wants, repo handles HOW
  const filter: MoodLogFilter = { user: userId };

  if (startDate || endDate) {
    const dateFilter: { $gte?: Date; $lte?: Date } = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    filter.date = dateFilter;
  }

  if (mood) {
    filter.mood = mood;
  }

  // One call → gets data + total count. No hand-rolling Promise.all.
  const options: QueryOptions<MoodLogFilter> = {
    filter,
    sort: { field: "date", order: "desc" },
    pagination: { skip, limit },
  };

  const result = await moodLogRepository.findAll(options);

  return {
    count: result.data.length,
    total: result.total,
    page,
    pages: Math.ceil(result.total / limit),
    data: result.data,
  };
};

export const getMoodByIdService = async (
  moodId: string,
  userId: string
): Promise<IMoodLog> => {
  const log = await moodLogRepository.findByUserAndId(userId, moodId);

  if (!log) {
    throw new NotFoundError("Mood log", moodId);
  }

  return log;
};

export const updateMoodService = async (
  moodId: string,
  userId: string,
  data: UpdateMoodLogInput
): Promise<IMoodLog> => {
  const log = await moodLogRepository.updateByUserAndId(
    userId,
    moodId,
    data as Record<string, unknown>
  );

  if (!log) {
    throw new NotFoundError("Mood log", moodId);
  }

  return log;
};

export const deleteMoodService = async (
  moodId: string,
  userId: string
): Promise<IMoodLog> => {
  const log = await moodLogRepository.deleteByUserAndId(userId, moodId);

  if (!log) {
    throw new NotFoundError("Mood log", moodId);
  }

  return log;
};

export const getMoodStatsService = async (
  userId: string,
  days: number
): Promise<MoodStats> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { summary, moodCounts } =
    await moodLogRepository.getStatsByUser(userId, startDate);

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
