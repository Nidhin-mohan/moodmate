import { IUser } from '../models/userModel';
import { BadRequestError, NotFoundError } from '../utils/customError';
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

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

  if (isPro === true) {
    filter.isPro = true;
  } else if (isPro === false) {
    // Accounts created before the isPro field existed have no value at all.
    filter.isPro = { $ne: true };
  }

  if (proSinceFrom || proSinceTo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: Record<string, any> = {};
    if (proSinceFrom) dateFilter.$gte = new Date(proSinceFrom);
    if (proSinceTo) dateFilter.$lte = new Date(proSinceTo);
    filter.proSince = dateFilter;
  }

  if (search) {
    // Escape so user input is matched literally: no 500 on "(", no ".*" match-all, no ReDoS.
    const regex = new RegExp(escapeRegex(search), 'i');
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

// An admin can never demote or delete themselves. Because the acting admin always
// stays an admin, this also guarantees at least one admin remains.
export async function updateUserService(
  actorId: string,
  userId: string,
  updates: UpdateUserInput,
): Promise<AdminUserView> {
  if (actorId === userId && updates.role !== undefined && updates.role !== 'admin') {
    throw new BadRequestError('You cannot change your own role');
  }

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

export async function softDeleteUserService(
  actorId: string,
  userId: string,
): Promise<AdminUserView> {
  if (actorId === userId) {
    throw new BadRequestError('You cannot delete your own account');
  }

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
