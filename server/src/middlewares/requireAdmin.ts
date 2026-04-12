import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/customError';

export const requireAdmin = (_req: Request, _res: Response, next: NextFunction): void => {
  if (_req.user?.role !== 'admin') {
    return next(new UnauthorizedError('Admin access required'));
  }
  next();
};
