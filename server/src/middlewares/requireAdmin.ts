import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/customError';

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
};
