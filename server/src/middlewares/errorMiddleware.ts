import { Request, Response, NextFunction } from "express";
import CustomError from "../utils/custumeError";
import { HTTP_STATUS } from "../constants/httpStatusCodes";
import { logger } from "../utils/logger";

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
  const statusCode =
    (err as CustomError).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Optionally log errors for debugging in development
  if (process.env.NODE_ENV !== "production") {
    logger.error("Error Stack:", err.stack || "No stack trace available");
  }

  // Example: Send error details to an external service
  // logErrorToService(err0);

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errorCode: (err as CustomError).errorCode || null,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

