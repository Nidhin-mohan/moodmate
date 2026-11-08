import { BaseRepository } from './baseRepository';
import User, { IUser } from '../models/userModel';

// ─── User-specific filter shape ──────────────────────────────────
export interface UserFilter {
  email?: string;
  role?: string;
  name?: RegExp;
  isPro?: boolean;
}

// The one definition of "active": not soft-deleted. Every query that should
// ignore deleted accounts uses this, so the rule can't drift between call sites.
export const ACTIVE_USER_FILTER = { isDeleted: { $ne: true } } as const;

// ─── USER REPOSITORY ─────────────────────────────────────────────
// Gets findAll, findById, create, updateById, deleteById, exists
// for FREE from BaseRepository. Only adds user-specific queries.
// ─────────────────────────────────────────────────────────────────

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  // ── User-specific queries ──────────────────────────────────

  // Any account with this email, deleted or not — registration uses it so a
  // deleted user's email stays taken.
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email } as Parameters<typeof this.findOne>[0]);
  }

  // Active account with this email (includes the password hash, for login).
  async findActiveByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email, ...ACTIVE_USER_FILTER } as Parameters<typeof this.findOne>[0]);
  }

  // Active user without password hash — for auth middleware and profile.
  // Soft-deleted users resolve to null, so their existing tokens stop working.
  async findByIdSecure(id: string): Promise<IUser | null> {
    return this.model
      .findOne({ _id: id, ...ACTIVE_USER_FILTER })
      .select('-password')
      .exec();
  }

  // Active Pro users who get the weekly AI analysis email.
  async findWeeklyAnalysisRecipients(): Promise<IUser[]> {
    const { data } = await this.findAll({
      filter: { isPro: true, ...ACTIVE_USER_FILTER },
      select: ['_id', 'name', 'email'],
      pagination: { skip: 0, limit: 10_000 },
    });
    return data;
  }

  // Active admins other than `excludingId` — used to never remove the last admin.
  async countActiveAdmins({ excludingId }: { excludingId: string }): Promise<number> {
    return this.model
      .countDocuments({ role: 'admin', _id: { $ne: excludingId }, ...ACTIVE_USER_FILTER })
      .exec();
  }
}

export const userRepository = new UserRepository();
