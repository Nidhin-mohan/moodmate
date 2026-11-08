import api from "@/api";
import { AxiosError } from "axios";

// Services
export const createMoodLog = async (data: MoodLogData): Promise<MoodLogResponse> => {
  try {
    const response = await api.post<MoodLogResponse>("/mood", data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    const errorMessage =
      axiosError.response?.data?.message ||
      "Failed to create mood log. Please try again.";
    throw new Error(errorMessage);
  }
};

export const getAllMoodLogs = async (
  filters?: MoodLogFilters
): Promise<MoodLogsResponse> => {
  try {
    const response = await api.get<MoodLogsResponse>("/mood", {
      params: filters,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    const errorMessage =
      axiosError.response?.data?.message ||
      "Failed to fetch mood logs. Please try again.";
    throw new Error(errorMessage);
  }
};

export const getMoodLogById = async (id: string): Promise<MoodLogResponse> => {
  try {
    const response = await api.get<MoodLogResponse>(`/mood/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    const errorMessage =
      axiosError.response?.data?.message ||
      "Failed to fetch mood log. Please try again.";
    throw new Error(errorMessage);
  }
};

/**
 * Fills in details on an entry. The UI calls this only from the "Add details"
 * flow straight after a quick log, with a patch from detailsPatch() — so it
 * only ever fills fields that were still empty (logs stay immutable in spirit).
 */
export const updateMoodLog = async (
  id: string,
  patch: MoodLogPatch
): Promise<MoodLogResponse> => {
  try {
    const response = await api.put<MoodLogResponse>(`/mood/${id}`, patch);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    const errorMessage =
      axiosError.response?.data?.message ||
      "Couldn't save your details. Please try again.";
    throw new Error(errorMessage);
  }
};

export const getMoodStats = async (days?: number): Promise<MoodStatsResponse> => {
  try {
    const response = await api.get<MoodStatsResponse>("/mood/stats", {
      params: { days },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message: string }>;
    const errorMessage =
      axiosError.response?.data?.message ||
      "Failed to fetch mood statistics. Please try again.";
    throw new Error(errorMessage);
  }
};


// Types
export type SocialQuality = 'isolated' | 'neutral' | 'connected';
export type MoodTriggerCategory = 'work' | 'relationships' | 'health' | 'finances' | 'environment' | 'random';

// Only `mood` is required: a quick log sends just the mood, and every other
// field is present only if the user reported it.
export interface MoodLogData {
  mood: string;
  specificEmotion?: string;
  intensity?: number;
  energyLevel?: number;
  stressLevel?: number;
  anxietyLevel?: number;
  tagsPeople?: string[];
  tagsPlaces?: string[];
  tagsEvents?: string[];
  socialQuality?: SocialQuality;
  moodTriggerCategory?: MoodTriggerCategory;
  sleepHours?: number;
  sleepQuality?: number;
  exercise?: boolean;
  exerciseMinutes?: number;
  notes?: string;
  reflections?: string;
  date?: string;
}

/** Fields "Add details" may fill in — everything except the mood itself. */
export type MoodLogPatch = Partial<Omit<MoodLogData, "mood" | "date">>;

export interface MoodLog extends MoodLogData {
  _id: string;
  user: string;
  aiAnalysis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoodLogResponse {
  success: boolean;
  data: MoodLog;
}

export interface MoodLogsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: MoodLog[];
}

export interface MoodStatsResponse {
  success: boolean;
  data: {
    period: string;
    // null = nothing recorded in the window (never 0 for "no data")
    avgIntensity: number | null;
    avgEnergyLevel: number | null;
    avgSleepHours: number | null;
    avgSleepQuality: number | null;
    totalLogs: number;
    moodBreakdown: Record<string, number>;
  };
}

export interface MoodLogFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  mood?: string;
}
