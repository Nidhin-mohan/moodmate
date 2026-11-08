import { BaseRepository } from './baseRepository';
import User, { IUser } from '../models/userModel';

// ─── User-specific filter shape ──────────────────────────────────
export interface UserFilter {
  email?: string;
  role?: string;
  name?: RegExp;
  isPro?: boolean;
}

// ─── USER REPOSITORY ─────────────────────────────────────────────
// Gets findAll, findById, create, updateById, deleteById, exists
// for FREE from BaseRepository. Only adds user-specific queries.
// ─────────────────────────────────────────────────────────────────

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  // ── User-specific queries ──────────────────────────────────
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email } as Parameters<typeof this.findOne>[0]);
  }

  // Active (not soft-deleted) user without password hash — for auth middleware and profile.
  // Soft-deleted users resolve to null, so their existing tokens stop working.
  async findByIdSecure(id: string): Promise<IUser | null> {
    return this.model
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .select('-password')
      .exec();
  }

  // Active Pro users who get the weekly AI analysis email.
  async findWeeklyAnalysisRecipients(): Promise<IUser[]> {
    const { data } = await this.findAll({
      filter: { isPro: true, isDeleted: { $ne: true } },
      select: ['_id', 'name', 'email'],
      pagination: { skip: 0, limit: 10_000 },
    });
    return data;
  }
}

export const userRepository = new UserRepository();
