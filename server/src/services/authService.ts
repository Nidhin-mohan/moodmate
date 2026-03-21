import { generateToken } from '../config/jwt';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/customError';
import { userRepository } from '../repositories/userRepository';

// ─── NOTICE ───────────────────────────────────────────────────────
// No "import User" anywhere. This service has ZERO knowledge of
// Mongoose. It talks to userRepository which could be backed by
// MongoDB, PostgreSQL, or an in-memory store — service doesn't care.
// ──────────────────────────────────────────────────────────────────

export const registerUserService = async (
  name: string,
  email: string,
  password: string,
): Promise<UserData> => {
  const userExists = await userRepository.findByEmail(email);
  if (userExists) {
    throw new ConflictError('User already exists');
  }

  const user = await userRepository.create({ name, email, password });
  const token = await generateToken(user._id);

  return {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    token,
  };
};

export const loginUserService = async (email: string, password: string): Promise<UserData> => {
  const user = await userRepository.findByEmail(email);
  if (!user || !(await user.matchPassword(password))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = await generateToken(user._id);
  return {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    token,
  };
};

export const getUserProfileService = async (userId: string): Promise<UserData> => {
  const user = await userRepository.findByIdSecure(userId);
  if (!user) {
    throw new NotFoundError('User', userId);
  }

  return {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
  };
};

interface UserData {
  userId: string;
  name: string;
  email: string;
  token?: string;
}
