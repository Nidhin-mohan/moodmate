import { IUser } from '../models/userModel';
import { NotFoundError } from '../utils/customError';
import { userRepository } from '../repositories/userRepository';
import type { UpdateUserInput } from '../validations/adminValidation';

const USER_SAFE_FIELDS = ['_id', 'name', 'email', 'role', 'isPro', 'createdAt'];

export interface AdminUserView {
  _id: string;
  name: string;
  email: string;
  role: string;
  isPro: boolean;
  createdAt: string;
}

export interface ListUsersResult {
  data: AdminUserView[];
  total: number;
  page: number;
  pages: number;
}

function toAdminView(user: IUser): AdminUserView {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: (user as IUser & { role: string }).role,
    isPro: user.isPro,
    createdAt: (user as IUser & { createdAt: Date }).createdAt?.toISOString?.() ?? '',
  };
}

export async function listUsersService(page: number, limit: number): Promise<ListUsersResult> {
  const skip = (page - 1) * limit;

  const { data, total } = await userRepository.findAll({
    select: USER_SAFE_FIELDS,
    sort: { field: 'createdAt', order: 'desc' },
    pagination: { skip, limit },
  });

  return {
    data: data.map(toAdminView),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function updateUserService(
  userId: string,
  updates: UpdateUserInput,
): Promise<AdminUserView> {
  const exists = await userRepository.exists({ _id: userId } as Parameters<
    typeof userRepository.exists
  >[0]);
  if (!exists) throw new NotFoundError('User', userId);

  const updated = await userRepository.updateById(userId, updates as Partial<IUser>);
  if (!updated) throw new NotFoundError('User', userId);

  return toAdminView(updated);
}
