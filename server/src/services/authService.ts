import User from "../models/userModel";
import { generateToken } from "../config/jwt";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../utils/customError";

export const registerUserService = async (
  name: string,
  email: string,
  password: string
): Promise<UserData> => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ConflictError("User already exists");
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  return {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    token,
  };
};

export const loginUserService = async (
  email: string,
  password: string
): Promise<UserData> => {
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = generateToken(user._id);
  return {
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    token,
  };
};

export const getUserProfileService = async (
  userId: string
): Promise<UserData> => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new NotFoundError("User", userId);
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
