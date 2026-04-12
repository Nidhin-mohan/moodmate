import { HTTP_STATUS } from '../constants/httpStatusCodes';
import { asyncHandler } from '../utils/asyncHandler';
import { listUsersQuerySchema, updateUserSchema } from '../validations/adminValidation';
import {
  listUsersService,
  softDeleteUserService,
  updateUserService,
} from '../services/admin.service';

export const listUsers = asyncHandler('Admin List Users', async (req, res) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await listUsersService(query);
  res.status(HTTP_STATUS.OK).json({ success: true, ...result });
});

export const updateUser = asyncHandler('Admin Update User', async (req, res) => {
  const updates = updateUserSchema.parse(req.body);
  const user = await updateUserService(req.params.id, updates);
  res.status(HTTP_STATUS.OK).json({ success: true, data: user });
});

export const softDeleteUser = asyncHandler('Admin Soft Delete User', async (req, res) => {
  const user = await softDeleteUserService(req.params.id);
  res.status(HTTP_STATUS.OK).json({ success: true, data: user });
});
