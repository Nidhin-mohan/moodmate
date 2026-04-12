import express from 'express';
import { listUsers, updateUser } from '../controllers/admin.controller';
import { authentication } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validateObjectId } from '../middlewares/validateObjectId';

const router = express.Router();

router.use(authentication, requireAdmin);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (paginated)
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
 *     responses:
 *       200:
 *         description: Paginated user list
 *       401:
 *         description: Not authenticated or not admin
 */
router.get('/users', listUsers);

/**
 * @openapi
 * /admin/users/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a user's role, isPro, or name
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
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user, therapist]
 *               isPro:
 *                 type: boolean
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 *       400:
 *         description: Validation error or invalid id
 *       401:
 *         description: Not authenticated or not admin
 *       404:
 *         description: User not found
 */
router.patch('/users/:id', validateObjectId(), updateUser);

export default router;
