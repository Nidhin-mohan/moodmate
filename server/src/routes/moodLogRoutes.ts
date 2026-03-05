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

/**
 * @openapi
 * /mood/stats:
 *   get:
 *     tags: [Mood]
 *     summary: Get aggregated mood statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: days
 *         in: query
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Aggregated mood stats (averages + mood breakdown)
 *       401:
 *         description: Not authenticated
 */
router.get('/stats', getMoodStats);

/**
 * @openapi
 * /mood:
 *   post:
 *     tags: [Mood]
 *     summary: Create a mood log
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMoodLog'
 *     responses:
 *       201:
 *         description: Mood log created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *   get:
 *     tags: [Mood]
 *     summary: List mood logs (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: mood
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of mood logs
 *       401:
 *         description: Not authenticated
 */
router.route('/').post(createMood).get(getAllMoods);

/**
 * @openapi
 * /mood/{id}:
 *   get:
 *     tags: [Mood]
 *     summary: Get a single mood log
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mood log data
 *       400:
 *         description: Invalid ObjectId
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Mood log not found
 *   put:
 *     tags: [Mood]
 *     summary: Update a mood log
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMoodLog'
 *     responses:
 *       200:
 *         description: Mood log updated
 *       400:
 *         description: Validation error or invalid ObjectId
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Mood log not found
 *   delete:
 *     tags: [Mood]
 *     summary: Delete a mood log
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mood log deleted
 *       400:
 *         description: Invalid ObjectId
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Mood log not found
 */
router.route('/:id').all(validateObjectId()).get(getMoodById).put(updateMood).delete(deleteMood);

export default router;
