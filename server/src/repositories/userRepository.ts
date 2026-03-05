import { BaseRepository } from "./baseRepository";
import User, { IUser } from "../models/userModel";

// ─── User-specific filter shape ──────────────────────────────────
export interface UserFilter {
  email?: string;
  role?: string;
  name?: RegExp;
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
    return this.findOne({ email } as any);
  }

  // Returns user without password hash — for auth middleware and profile
  async findByIdSecure(id: string): Promise<IUser | null> {
    return this.model.findById(id).select("-password").exec();
  }
}

export const userRepository = new UserRepository();
