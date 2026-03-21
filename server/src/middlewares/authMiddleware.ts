import { jwtVerify } from 'jose';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/userModel';
import { UnauthorizedError } from '../utils/customError';
import { env } from '../config/env';
import { userRepository } from '../repositories/userRepository';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return next(new UnauthorizedError('Not authorized, no token'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(token, secret);

    const user = await userRepository.findByIdSecure(payload.id as string);

    if (!user) {
      return next(new UnauthorizedError('Not authorized, user not found'));
    }

    req.user = user as IUser;
    next();
  } catch (error) {
    next(new UnauthorizedError('Not authorized, token failed'));
  }
};
