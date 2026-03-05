import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { BadRequestError } from '../utils/customError';

export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError(`Invalid ${paramName}: ${id}`);
    }
    next();
  };
};
