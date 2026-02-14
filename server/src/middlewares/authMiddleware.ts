import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/userModel";
import CustomError from "../utils/customError";

interface JwtPayload {
  id: string;
}

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return next(new CustomError("Not authorized, no token", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new CustomError("Not authorized, user not found", 401));
    }

    req.user = user as IUser;
    next();
  } catch (error) {
    next(new CustomError("Not authorized, token failed", 401));
  }
};
