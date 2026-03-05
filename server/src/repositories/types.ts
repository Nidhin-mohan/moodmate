// ─── SHARED QUERY TYPES ──────────────────────────────────────────
// Write once, use in every repository and service.
// These types define the "language" for querying data — completely
// database-agnostic. No Mongoose, no MongoDB, no SQL here.
// ─────────────────────────────────────────────────────────────────

// What callers pass to control the query
export interface QueryOptions<TFilter = Record<string, unknown>> {
  filter?: TFilter;
  select?: string[];
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
  pagination?: {
    skip: number;
    limit: number;
  };
}

// What every findAll returns — data + total count for pagination
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

// Aggregation result shape for mood stats
export interface AggregatedStats {
  summary: Array<{
    avgIntensity: number | null;
    avgEnergyLevel: number | null;
    avgSleepHours: number | null;
    avgSleepQuality: number | null;
    totalLogs: number;
  }>;
  moodCounts: Array<{
    _id: string;
    count: number;
  }>;
}
