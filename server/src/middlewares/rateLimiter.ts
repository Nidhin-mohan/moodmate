import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

const createRateLimiter = (config: RateLimitConfig): RequestHandler => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      message: config.message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Auth routes: 20 requests per 15 minutes per IP
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts, please try again after 15 minutes',
});

// Health check: 10 requests per minute per IP
export const healthLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many health check requests, try again later',
});
