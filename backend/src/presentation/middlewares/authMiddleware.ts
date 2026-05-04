/**
 * Authentication Middleware
 * Xác thực JWT token và gắn user info vào request
 */

import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../application/services/JwtService';
import { AppError } from '../../application/errors/AppError';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roles: string[];
      };
    }
  }
}

const jwtService = new JwtService();

export const authMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  try {
    // 1. Lấy token từ header
    const authHeader = _req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token không được cung cấp', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // 2. Verify token
    const payload = jwtService.verifyAccessToken(token);
    if (!payload) {
      throw new AppError('Token không hợp lệ hoặc đã hết hạn', 401);
    }

    // 3. Gắn user info vào request
    _req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
      if (!hasRole) {
        throw new AppError('Bạn không có quyền truy cập tài nguyên này', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
