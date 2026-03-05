// routes/moodRoutes.ts
import express from 'express';
import {
  createMood,
  getAllMoods,
  getMoodById,
  updateMood,
  deleteMood,
  getMoodStats,
} from '../controllers/moodLogController';
import { authentication } from '../middlewares/authMiddleware';
import { validateObjectId } from '../middlewares/validateObjectId';

const router = express.Router();

router.use(authentication);

router.get('/stats', getMoodStats);

router.route('/').post(createMood).get(getAllMoods);

router.route('/:id').all(validateObjectId()).get(getMoodById).put(updateMood).delete(deleteMood);

export default router;
