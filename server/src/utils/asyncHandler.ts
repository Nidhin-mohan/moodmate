import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

type HandlerFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (taskName: string, fn: HandlerFn) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string | undefined;
    const child = logger.child({ task: taskName, requestId });

    child.info('started');
    try {
      await fn(req, res, next);
      child.info('completed');
    } catch (error) {
      child.error({ err: error }, 'failed');
      next(error);
    }
  };
};
