import { HTTP_STATUS } from "../constants/httpStatusCodes";
import { asyncHandler } from "../utils/asyncHandler";
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

// Compare this to the old version: no try/catch, no logger calls,
// no next(error). The asyncHandler wrapper does all of that.
// Each handler is now ONLY the unique logic for that route.

export const createMood = asyncHandler("Create Mood Log", async (req, res) => {
  const data = createMoodLogSchema.parse(req.body);
  const newLog = await createMoodService(req.user!._id, data);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: newLog,
  });
});

export const getAllMoods = asyncHandler("Get All Moods", async (req, res) => {
  const result = await getAllMoodsService(req.user!._id, {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    mood: req.query.mood as string,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    ...result,
  });
});

export const getMoodById = asyncHandler("Get Mood By ID", async (req, res) => {
  const log = await getMoodByIdService(req.params.id, req.user!._id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: log,
  });
});

export const updateMood = asyncHandler("Update Mood Log", async (req, res) => {
  const data = updateMoodLogSchema.parse(req.body);
  const log = await updateMoodService(req.params.id, req.user!._id, data);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: log,
  });
});

export const deleteMood = asyncHandler("Delete Mood Log", async (req, res) => {
  await deleteMoodService(req.params.id, req.user!._id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Mood log deleted",
  });
});

export const getMoodStats = asyncHandler("Get Mood Stats", async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const statsData = await getMoodStatsService(req.user!._id, days);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: statsData,
  });
});
