import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

/**
 * Middleware to authenticate requests via our custom JWT in Authorization header.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required: Bearer token missing', 401));
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return next(new AppError('Server configuration error: JWT_SECRET not configured', 500));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    // Attach decoded user payload { uid, email, role, iat, exp }
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token', 401));
  }
};

/**
 * Optional authentication middleware:
 * Populates req.user if a valid token is present; otherwise proceeds with req.user = null.
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
  } catch {
    req.user = null;
  }

  next();
};

/**
 * Middleware to authorize requests based on user roles.
 * Allowed roles: 'admin' | 'organizer' | 'participant' | 'guest'
 * @param {string | string[]} allowedRoles - Single role or array of allowed roles
 */
export const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required before role verification', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' lacks permissions for this action. Required: [${roles.join(', ')}]`,
          403
        )
      );
    }

    next();
  };
};
