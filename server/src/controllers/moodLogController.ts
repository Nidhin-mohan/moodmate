import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { HTTP_STATUS } from "../constants/httpStatusCodes";
import {
  createMoodLogSchema,
  updateMoodLogSchema,
} from "../validations/moodLogValidation";
import {
  createMoodService,
  getAllMoodsService,
  getMoodByIdService,
  updateMoodService,
  deleteMoodService,
  getMoodStatsService,
} from "../services/moodLogService";

// @desc    Create a new mood log
// @route   POST /mood
// @access  Private
export const createMood = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const taskName = "Create Mood Log";
  logger.start(taskName);

  try {
    const data = createMoodLogSchema.parse(req.body);
    const newLog = await createMoodService(req.user!._id, data);

    logger.complete(taskName);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: newLog,
    });
  } catch (error) {
    logger.error(taskName, (error as Error).message);
    next(error);
  }
};

// @desc    Get all mood logs for the current user (paginated)
// @route   GET /mood
// @access  Private
export const getAllMoods = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const taskName = "Get All Moods";
  logger.start(taskName);

  try {
    const result = await getAllMoodsService(req.user!._id, {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      mood: req.query.mood as string,
    });

    logger.complete(taskName);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(taskName, (error as Error).message);
    next(error);
  }
};

// @desc    Get a single mood log by ID
// @route   GET /mood/:id
// @access  Private
export const getMoodById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const taskName = "Get Mood By ID";
  logger.start(taskName);

  try {
    const log = await getMoodByIdService(req.params.id, req.user!._id);

    logger.complete(taskName);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: log,
    });
  } catch (error) {
    logger.error(taskName, (error as Error).message);
    next(error);
  }
};

// @desc    Update a mood log
// @route   PUT /mood/:id
// @access  Private
export const updateMood = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const taskName = "Update Mood Log";
  logger.start(taskName);

  try {
    const data = updateMoodLogSchema.parse(req.body);
    const log = await updateMoodService(req.params.id, req.user!._id, data);

    logger.complete(taskName);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: log,
    });
  } catch (error) {
    logger.error(taskName, (error as Error).message);
    next(error);
  }
};

// @desc    Delete a mood log
// @route   DELETE /mood/:id
// @access  Private
export const deleteMood = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const taskName = "Delete Mood Log";
  logger.start(taskName);

  try {
    await deleteMoodService(req.params.id, req.user!._id);

    logger.complete(taskName);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Mood log deleted",
    });
  } catch (error) {
    logger.error(taskName, (error as Error).message);
    next(error);
  }
};

// @desc    Get mood statistics for the current user
// @route   GET /mood/stats
// @access  Private
export const getMoodStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const taskName = "Get Mood Stats";
  logger.start(taskName);

  try {
    const days = parseInt(req.query.days as string) || 30;
    const statsData = await getMoodStatsService(req.user!._id, days);

    logger.complete(taskName);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    logger.error(taskName, (error as Error).message);
    next(error);
  }
};
