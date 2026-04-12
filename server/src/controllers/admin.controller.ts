import { HTTP_STATUS } from '../constants/httpStatusCodes';
import { asyncHandler } from '../utils/asyncHandler';
import { updateUserSchema } from '../validations/adminValidation';
import { listUsersService, updateUserService } from '../services/admin.service';

export const listUsers = asyncHandler('Admin List Users', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await listUsersService(page, limit);

  res.status(HTTP_STATUS.OK).json({ success: true, ...result });
});

export const updateUser = asyncHandler('Admin Update User', async (req, res) => {
  const updates = updateUserSchema.parse(req.body);
  const user = await updateUserService(req.params.id, updates);

  res.status(HTTP_STATUS.OK).json({ success: true, data: user });
});
