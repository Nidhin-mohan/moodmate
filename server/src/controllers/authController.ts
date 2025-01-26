import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";
import { generateToken } from "../config/jwt";
import CustomError from "../utils/custumeError";
import { HTTP_STATUS, MESSAGES } from "../constants/httpStatusCodes";

// Register a user
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log("first", name, email, password);
      throw new CustomError("All fields are required", 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new CustomError("User already exists", 400);
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

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
    next(error);
  }
};

// Login a user
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new CustomError("Email and password are required", 400);
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      throw new CustomError("Invalid email or password", 401);
    }

    const token = generateToken(user._id);

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
    next(error);
  }
};

// Get user profile
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req?.user?._id).select("-password");
    if (!user) {
      throw new CustomError("User not found", 404);
    }

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
    next(error);
  }
};
