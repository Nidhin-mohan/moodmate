// services/authService.ts

import User from "../models/userModel";
import { generateToken } from "../config/jwt";
import CustomError from "../utils/custumeError";

export const registerUserService = async (
  name: string,
  email: string,
  password: string
): Promise<UserData> => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new CustomError("User already exists", 400);
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
    throw new CustomError("Invalid email or password", 401);
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
    throw new CustomError("User not found", 404);
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
