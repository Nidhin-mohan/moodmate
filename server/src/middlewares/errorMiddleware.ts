import { Request, Response, NextFunction } from "express";
import CustomError from "../utils/custumeError";

// Middleware to handle not found routes
export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new CustomError(`Route not found - ${req.originalUrl}`, 404);
  next(error);
};

// Middleware to handle errors
export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = (err as CustomError).statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
