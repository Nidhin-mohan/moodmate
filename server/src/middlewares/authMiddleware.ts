import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/userModel";
import { UnauthorizedError } from "../utils/customError";
import { env } from "../config/env";

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
    return next(new UnauthorizedError("Not authorized, no token"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET
    ) as JwtPayload;

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new UnauthorizedError("Not authorized, user not found"));
    }

    req.user = user as IUser;
    next();
  } catch (error) {
    next(new UnauthorizedError("Not authorized, token failed"));
  }
};
