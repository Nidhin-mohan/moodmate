import { IMoodLog } from '../models/moodLogModel';
import { NotFoundError } from '../utils/customError';
import { escapeRegex } from '../utils/escapeRegex';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
import { moodLogRepository, MoodLogFilter } from '../repositories/moodLogRepository';
import type { QueryOptions } from '../repositories/types';
import type {
  CreateMoodLogInput,
  UpdateMoodLogInput,
  ListMoodsQuery,
} from '../validations/moodLogValidation';

interface PaginatedMoodResult {
  count: number;
  total: number;
  page: number;
  pages: number;
  data: IMoodLog[];
}

// Averages are null when no log in the window recorded that field —
// "no data" must never be reported as 0.
interface MoodStats {
  period: string;
  avgIntensity: number | null;
  avgEnergyLevel: number | null;
  avgSleepHours: number | null;
  avgSleepQuality: number | null;
  totalLogs: number;
  moodBreakdown: Record<string, number>;
}

const round1 = (v: number | null | undefined): number | null =>
  typeof v === 'number' ? Math.round(v * 10) / 10 : null;

export const createMoodService = async (
  userId: string,
  data: CreateMoodLogInput,
): Promise<IMoodLog> => {
  return moodLogRepository.create({
    user: userId,
    ...data,
    date: data.date || new Date(),
  } as unknown as Partial<IMoodLog>);
};

export const getAllMoodsService = async (
  userId: string,
  params: ListMoodsQuery,
): Promise<PaginatedMoodResult> => {
  const { page, limit, startDate, endDate, mood } = params;
  const skip = (page - 1) * limit;

  // Build typed filter — service says WHAT it wants, repo handles HOW
  const filter: MoodLogFilter = { user: userId };

  // Never list far-future legacy logs: new dates are capped at now + 1 day on create/update,
  // so anything later is bad data (stats ignore it too). A tighter endDate still wins.
  const latest = new Date(Date.now() + ONE_DAY_MS);
  const dateFilter: { $gte?: Date; $lte: Date } = {
    $lte: endDate && endDate < latest ? endDate : latest,
  };
  if (startDate) dateFilter.$gte = startDate;
  filter.date = dateFilter;

  // Moods are free strings and legacy data is lower-case ("happy"), so match case-insensitively.
  if (mood) {
    filter.mood = new RegExp(`^${escapeRegex(mood)}$`, 'i');
  }

  // One call → gets data + total count. No hand-rolling Promise.all.
  const options: QueryOptions<MoodLogFilter> = {
    filter,
    sort: { field: 'date', order: 'desc' },
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

export const getMoodByIdService = async (moodId: string, userId: string): Promise<IMoodLog> => {
  const log = await moodLogRepository.findByUserAndId(userId, moodId);

  if (!log) {
    throw new NotFoundError('Mood log', moodId);
  }

  return log;
};

export const updateMoodService = async (
  moodId: string,
  userId: string,
  data: UpdateMoodLogInput,
): Promise<IMoodLog> => {
  const log = await moodLogRepository.updateByUserAndId(
    userId,
    moodId,
    data as Record<string, unknown>,
  );

  if (!log) {
    throw new NotFoundError('Mood log', moodId);
  }

  return log;
};

export const deleteMoodService = async (moodId: string, userId: string): Promise<IMoodLog> => {
  const log = await moodLogRepository.deleteByUserAndId(userId, moodId);

  if (!log) {
    throw new NotFoundError('Mood log', moodId);
  }

  return log;
};

export const getMoodStatsService = async (userId: string, days: number): Promise<MoodStats> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { summary, moodCounts } = await moodLogRepository.getStatsByUser(userId, startDate);

  const moodBreakdown: Record<string, number> = {};
  for (const entry of moodCounts) {
    moodBreakdown[entry._id] = entry.count;
  }

  const stats = summary[0];

  return {
    period: `Last ${days} days`,
    avgIntensity: round1(stats?.avgIntensity),
    avgEnergyLevel: round1(stats?.avgEnergyLevel),
    avgSleepHours: round1(stats?.avgSleepHours),
    avgSleepQuality: round1(stats?.avgSleepQuality),
    totalLogs: stats?.totalLogs || 0,
    moodBreakdown,
  };
};
