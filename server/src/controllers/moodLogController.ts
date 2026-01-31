import { Request, Response } from "express";
import MoodLog from "../models/moodLogModel";

// Helper to convert comma-separated string to array
const toArray = (str: string | undefined): string[] =>
  str ? str.split(",").map((s) => s.trim()).filter((s) => s) : [];

// @desc    Create a new mood log
// @route   POST /mood
// @access  Private
export const createMood = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      mood,
      specificEmotion,
      intensity,
      energyLevel,
      tagsPeople,
      tagsPlaces,
      tagsEvents,
      sleepHours,
      sleepQuality,
      exercise,
      notes,
      reflections,
      date,
    } = req.body;

    const newLog = await MoodLog.create({
      user: req.user!._id,
      mood,
      specificEmotion,
      intensity,
      energyLevel,
      tagsPeople: Array.isArray(tagsPeople) ? tagsPeople : toArray(tagsPeople),
      tagsPlaces: Array.isArray(tagsPlaces) ? tagsPlaces : toArray(tagsPlaces),
      tagsEvents: Array.isArray(tagsEvents) ? tagsEvents : toArray(tagsEvents),
      sleepHours,
      sleepQuality,
      exercise,
      notes,
      reflections,
      date: date || new Date(),
    });

    res.status(201).json({
      success: true,
      data: newLog,
    });
  } catch (error) {
    console.error("Error creating mood:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all mood logs for the current user (paginated)
// @route   GET /mood
// @access  Private
export const getAllMoods = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { user: req.user!._id };

    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate as string);
      }
    }

    if (req.query.mood) {
      filter.mood = req.query.mood;
    }

    const [logs, total] = await Promise.all([
      MoodLog.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      MoodLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching moods:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get a single mood log by ID
// @route   GET /mood/:id
// @access  Private
export const getMoodById = async (req: Request, res: Response): Promise<void> => {
  try {
    const log = await MoodLog.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });

    if (!log) {
      res.status(404).json({ success: false, message: "Mood log not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Error fetching mood:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update a mood log
// @route   PUT /mood/:id
// @access  Private
export const updateMood = async (req: Request, res: Response): Promise<void> => {
  try {
    const log = await MoodLog.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });

    if (!log) {
      res.status(404).json({ success: false, message: "Mood log not found" });
      return;
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
      if (req.body[field] !== undefined) {
        if (["tagsPeople", "tagsPlaces", "tagsEvents"].includes(field)) {
          const value = req.body[field];
          (log as any)[field] = Array.isArray(value) ? value : toArray(value);
        } else {
          (log as any)[field] = req.body[field];
        }
      }
    });

    await log.save();

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Error updating mood:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete a mood log
// @route   DELETE /mood/:id
// @access  Private
export const deleteMood = async (req: Request, res: Response): Promise<void> => {
  try {
    const log = await MoodLog.findOneAndDelete({
      _id: req.params.id,
      user: req.user!._id,
    });

    if (!log) {
      res.status(404).json({ success: false, message: "Mood log not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Mood log deleted",
    });
  } catch (error) {
    console.error("Error deleting mood:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get mood statistics for the current user
// @route   GET /mood/stats
// @access  Private
export const getMoodStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await MoodLog.aggregate([
      {
        $match: {
          user: req.user!._id,
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

    res.status(200).json({
      success: true,
      data: {
        period: `Last ${days} days`,
        avgIntensity: stats[0]?.avgIntensity?.toFixed(1) || 0,
        avgEnergyLevel: stats[0]?.avgEnergyLevel?.toFixed(1) || 0,
        avgSleepHours: stats[0]?.avgSleepHours?.toFixed(1) || 0,
        avgSleepQuality: stats[0]?.avgSleepQuality?.toFixed(1) || 0,
        totalLogs: stats[0]?.totalLogs || 0,
        moodBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching mood stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};