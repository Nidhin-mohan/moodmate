import { Types } from "mongoose";
import { BaseRepository } from "./baseRepository";
import MoodLog, { IMoodLog } from "../models/moodLogModel";
import type { AggregatedStats } from "./types";

// ─── MoodLog-specific filter shape ───────────────────────────────
export interface MoodLogFilter {
  user?: string;
  mood?: string;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

// ─── MOOD LOG REPOSITORY ─────────────────────────────────────────
// Gets findAll, findById, create, updateById, deleteById, exists
// for FREE from BaseRepository. Only adds mood-specific queries:
//   - User-scoped lookups (security: every query must filter by user)
//   - Aggregation pipeline for stats (very MongoDB-specific)
// ─────────────────────────────────────────────────────────────────

class MoodLogRepository extends BaseRepository<IMoodLog> {
  constructor() {
    super(MoodLog);
  }

  // ── User-scoped queries ────────────────────────────────────
  // These enforce ownership — the service can't accidentally
  // forget to filter by userId.

  async findByUserAndId(
    userId: string,
    moodId: string
  ): Promise<IMoodLog | null> {
    return this.findOne({ _id: moodId, user: userId } as any);
  }

  async updateByUserAndId(
    userId: string,
    moodId: string,
    data: Record<string, unknown>
  ): Promise<IMoodLog | null> {
    return this.model
      .findOneAndUpdate(
        { _id: moodId, user: userId },
        { $set: data },
        { new: true, runValidators: true }
      )
      .exec();
  }

  async deleteByUserAndId(
    userId: string,
    moodId: string
  ): Promise<IMoodLog | null> {
    return this.model
      .findOneAndDelete({ _id: moodId, user: userId })
      .exec();
  }

  // ── Aggregation ────────────────────────────────────────────
  // This is the most MongoDB-specific code in the entire app.
  // If you switch to PostgreSQL, this becomes a SQL query with
  // GROUP BY and AVG() — but the interface stays the same.
  async getStatsByUser(
    userId: string,
    startDate: Date
  ): Promise<AggregatedStats> {
    const matchStage = {
      $match: {
        user: new Types.ObjectId(userId),
        date: { $gte: startDate },
      },
    };

    const [summary, moodCounts] = await Promise.all([
      this.model.aggregate([
        matchStage,
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
      this.model.aggregate([
        matchStage,
        {
          $group: {
            _id: "$mood",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return { summary, moodCounts };
  }
}

export const moodLogRepository = new MoodLogRepository();
