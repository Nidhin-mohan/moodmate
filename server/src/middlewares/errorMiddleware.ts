import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import CustomError from "../utils/customError";
import { HTTP_STATUS } from "../constants/httpStatusCodes";
import { env } from "../config/env";
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
  err: Error | CustomError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  const statusCode =
    (err as CustomError).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  if (env.NODE_ENV !== "production") {
    logger.error("Error Stack:", err.stack || "No stack trace available");
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errorCode: (err as CustomError).errorCode || null,
    stack: env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
