import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import User from "../models/userModel";
import { generateToken } from "../config/jwt";
import { HTTP_STATUS, MESSAGES } from "../constants/httpStatusCodes";
import { logger } from "../utils/logger";
import CustomError from "../utils/custumeError";
import { loginSchema, registerSchema } from "../validations/userValidation";

// Register a user
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const taskName = "User Registration";
  logger.start(taskName);

  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.error(taskName, "User already exists: " + email);
      throw new CustomError("User already exists", 400);
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    logger.complete(taskName);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.USER_CREATED,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    logger.error(taskName, (error as Error).message);
    next(error);
  }
};

// Login a user
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const taskName = "User Login";
  logger.start(taskName);

  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      logger.error(taskName, "Invalid credentials for email: " + email);
      throw new CustomError("Invalid email or password", 401);
    }

    const token = generateToken(user._id);

    logger.complete(taskName);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.LOGIN_SUCCESS,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error(taskName, (error as Error).message);
    next(error);
  }
};

// Get user profile
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const taskName = "Get User Profile";
  logger.start(taskName);

  try {
    const user = await User.findById(req?.user?._id).select("-password");
    if (!user) {
      logger.error(taskName, "User not found for ID: " + req.user._id);
      throw new CustomError("User not found", 404);
    }

    logger.complete(taskName);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.USER_RETRIEVED,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error(taskName, (error as Error).message);
    next(error);
  }
};
