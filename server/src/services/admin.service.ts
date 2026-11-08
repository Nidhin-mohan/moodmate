import { IUser } from '../models/userModel';
import { BadRequestError, NotFoundError } from '../utils/customError';
import { userRepository, ACTIVE_USER_FILTER } from '../repositories/userRepository';
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
    Object.assign(filter, ACTIVE_USER_FILTER);
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
    if (proSinceFrom) dateFilter.$gte = proSinceFrom;
    if (proSinceTo) dateFilter.$lte = proSinceTo;
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

// Who is acting on whom. One object so the two ids can't be swapped by accident.
export interface AdminAction {
  actorId: string;
  targetId: string;
}

// ObjectIds are hex: the API accepts either case, so compare case-insensitively.
const isSelf = ({ actorId, targetId }: AdminAction) =>
  actorId.toLowerCase() === targetId.toLowerCase();

// Refuse any change that would remove the target's admin access when they are the
// only active admin left. Self-protection already covers the common case; this
// also covers two admins acting on each other.
async function assertNotLastAdmin(target: IUser): Promise<void> {
  if (target.role !== 'admin' || target.isDeleted) return;
  const others = await userRepository.countActiveAdmins({ excludingId: target._id.toString() });
  if (others === 0) {
    throw new BadRequestError('Cannot remove the last admin');
  }
}

export async function updateUserService(
  action: AdminAction,
  updates: UpdateUserInput,
): Promise<AdminUserView> {
  const demoting = updates.role !== undefined && updates.role !== 'admin';
  if (demoting && isSelf(action)) {
    throw new BadRequestError('You cannot change your own role');
  }

  const target = await userRepository.findById(action.targetId);
  if (!target) throw new NotFoundError('User', action.targetId);
  if (demoting) await assertNotLastAdmin(target);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = { ...updates };
  // Track proSince when isPro is toggled on
  if (updates.isPro === true && !target.isPro) {
    payload.proSince = new Date();
  } else if (updates.isPro === false) {
    payload.proSince = null;
  }

  const updated = await userRepository.updateById(action.targetId, payload as Partial<IUser>);
  if (!updated) throw new NotFoundError('User', action.targetId);

  return toAdminView(updated);
}

export async function softDeleteUserService(action: AdminAction): Promise<AdminUserView> {
  if (isSelf(action)) {
    throw new BadRequestError('You cannot delete your own account');
  }

  const target = await userRepository.findById(action.targetId);
  if (!target || target.isDeleted) throw new NotFoundError('User', action.targetId);
  await assertNotLastAdmin(target);

  const updated = await userRepository.updateById(action.targetId, {
    isDeleted: true,
    deletedAt: new Date(),
  } as Partial<IUser>);
  if (!updated) throw new NotFoundError('User', action.targetId);

  return toAdminView(updated);
}
