import { SignJWT } from 'jose';
import { env } from './env';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const generateToken = async (userId: string): Promise<string> => {
  return new SignJWT({ id: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
};
