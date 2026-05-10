/**
 * Role Middleware
 * Kiểm tra quyền truy cập dựa trên role
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../application/errors/AppError';

/**
 * Middleware kiểm tra role của user
 * @param allowedRoles - Danh sách các role được phép truy cập
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized - User not authenticated', 401);
      }

      // Kiểm tra xem user có ít nhất 1 role trong allowedRoles không
      const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
      
      if (!hasRole) {
        throw new AppError(
          `Forbidden - Required roles: ${allowedRoles.join(', ')}`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware kiểm tra role admin
 */
export const requireAdmin = roleMiddleware(['admin']);

/**
 * Middleware kiểm tra role staff hoặc admin
 */
export const requireStaff = roleMiddleware(['staff', 'admin', 'manager']);

/**
 * Middleware kiểm tra role manager hoặc admin
 */
export const requireManager = roleMiddleware(['manager', 'admin']);
