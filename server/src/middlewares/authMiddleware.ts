import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/userModel";
import CustomError from "../utils/custumeError";

interface JwtPayload {
  id: string;
}

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;

      req.user = (await User.findById(decoded.id).select("-password")) as IUser;
      next();
    } catch (error) {
      next(new CustomError("Not authorized, token failed", 401));
    }
  }

  if (!token) {
    next(new CustomError("Not authorized, no token", 401));
  }
};
