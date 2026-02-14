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
export interface MoodLogData {
  mood: string;
  specificEmotion?: string;
  intensity: number;
  energyLevel: number;
  tagsPeople?: string[];
  tagsPlaces?: string[];
  tagsEvents?: string[];
  sleepHours: number;
  sleepQuality: number;
  exercise?: boolean;
  notes?: string;
  reflections?: string;
  date?: string;
}

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
    avgIntensity: string;
    avgEnergyLevel: string;
    avgSleepHours: string;
    avgSleepQuality: string;
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
