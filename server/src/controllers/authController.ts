// controllers/authController.ts

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { HTTP_STATUS, MESSAGES } from "../constants/httpStatusCodes";
import { registerSchema, loginSchema } from "../validations/userValidation";
import {
  registerUserService,
  loginUserService,
  getUserProfileService,
} from "../services/authService";

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
    const userData = await registerUserService(name, email, password);

    logger.complete(taskName);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: MESSAGES.USER_CREATED,
      data: userData,
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
    const userData = await loginUserService(email, password);

    logger.complete(taskName);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.LOGIN_SUCCESS,
      data: userData,
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
    const userId = req.user?._id.toString();
    const userData = await getUserProfileService(userId);

    logger.complete(taskName);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.USER_RETRIEVED,
      data: userData,
    });
  } catch (error) {
    logger.error(taskName, (error as Error).message);
    next(error);
  }
};
