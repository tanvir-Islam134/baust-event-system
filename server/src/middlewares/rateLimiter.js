import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Standard API rate limiter to protect against brute-force and DoS attacks.
 * In development / localhost, rate limiting is skipped so you are never locked out.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100000 : 2500, // High ceiling in development
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    if (isDev) return true;
    const ip = req.ip || req.connection?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1');
  },
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  },
});

/**
 * Stricter rate limiter for sensitive routes (e.g. auth, payment callbacks).
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: {
    success: false,
    error: {
      message: 'Too many attempts from this IP, please try again later',
    },
  },
});

