import express from "express";
import {
  createMood,
  getAllMoods,
  getMoodById,
  updateMood,
  deleteMood,
  getMoodStats,
} from "../controllers/moodLogController";
import { authentication } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(authentication);

// Stats route (must be before /:id to avoid conflict)
router.get("/stats", getMoodStats);

router.route("/")
  .post(createMood)
  .get(getAllMoods);

router.route("/:id")
  .get(getMoodById)
  .put(updateMood)
  .delete(deleteMood);

export default router;