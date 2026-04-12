import express from 'express';
import { listUsers, softDeleteUser, updateUser } from '../controllers/admin.controller';
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
 *     summary: List all users (paginated, searchable, filterable)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 20 }
 *       - name: search
 *         in: query
 *         description: Search by name or email (case-insensitive)
 *         schema: { type: string }
 *       - name: role
 *         in: query
 *         schema: { type: string, enum: [admin, user, therapist] }
 *       - name: isPro
 *         in: query
 *         schema: { type: boolean }
 *       - name: proSinceFrom
 *         in: query
 *         description: Filter users who became Pro on or after this ISO date
 *         schema: { type: string, format: date }
 *       - name: proSinceTo
 *         in: query
 *         description: Filter users who became Pro on or before this ISO date
 *         schema: { type: string, format: date }
 *       - name: includeDeleted
 *         in: query
 *         description: Include soft-deleted users (default false)
 *         schema: { type: boolean }
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
 *         schema: { type: string }
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

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Soft-delete a user (sets isDeleted=true, records deletedAt)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User soft-deleted
 *       401:
 *         description: Not authenticated or not admin
 *       404:
 *         description: User not found or already deleted
 */
router.delete('/users/:id', validateObjectId(), softDeleteUser);

export default router;
