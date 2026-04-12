import { IUser } from '../models/userModel';
import { NotFoundError } from '../utils/customError';
import { userRepository } from '../repositories/userRepository';
import type { ListUsersQuery, UpdateUserInput } from '../validations/adminValidation';

const USER_SAFE_FIELDS = [
  '_id',
  'name',
  'email',
  'role',
  'isPro',
  'proSince',
  'isDeleted',
  'deletedAt',
  'createdAt',
];

export interface AdminUserView {
  _id: string;
  name: string;
  email: string;
  role: string;
  isPro: boolean;
  proSince: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface ListUsersResult {
  data: AdminUserView[];
  total: number;
  page: number;
  pages: number;
}

function toAdminView(user: IUser): AdminUserView {
  const u = user as IUser & { createdAt: Date };
  return {
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    isPro: u.isPro,
    proSince: u.proSince ? u.proSince.toISOString() : null,
    isDeleted: u.isDeleted,
    deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
    createdAt: u.createdAt?.toISOString?.() ?? '',
  };
}

export async function listUsersService(query: ListUsersQuery): Promise<ListUsersResult> {
  const { page, limit, search, role, isPro, proSinceFrom, proSinceTo, includeDeleted } = query;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (!includeDeleted) {
    filter.isDeleted = { $ne: true };
  }

  if (role) {
    filter.role = role;
  }

  if (typeof isPro === 'boolean') {
    filter.isPro = isPro;
  }

  if (proSinceFrom || proSinceTo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: Record<string, any> = {};
    if (proSinceFrom) dateFilter.$gte = new Date(proSinceFrom);
    if (proSinceTo) dateFilter.$lte = new Date(proSinceTo);
    filter.proSince = dateFilter;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const { data, total } = await userRepository.findAll({
    filter,
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

  // Track proSince when isPro is toggled on
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = { ...updates };
  if (updates.isPro === true) {
    const current = await userRepository.findById(userId);
    if (current && !current.isPro) {
      payload.proSince = new Date();
    }
  } else if (updates.isPro === false) {
    payload.proSince = null;
  }

  const updated = await userRepository.updateById(userId, payload as Partial<IUser>);
  if (!updated) throw new NotFoundError('User', userId);

  return toAdminView(updated);
}

export async function softDeleteUserService(userId: string): Promise<AdminUserView> {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError('User', userId);
  if (user.isDeleted) throw new NotFoundError('User', userId);

  const updated = await userRepository.updateById(userId, {
    isDeleted: true,
    deletedAt: new Date(),
  } as Partial<IUser>);
  if (!updated) throw new NotFoundError('User', userId);

  return toAdminView(updated);
}
