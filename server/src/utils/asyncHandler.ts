import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

type HandlerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler = (
  taskName: string,
  fn: HandlerFn
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.start(taskName);
    try {
      await fn(req, res, next);
      logger.complete(taskName);
    } catch (error) {
      logger.error(taskName, (error as Error).message);
      next(error);
    }
  };
};
