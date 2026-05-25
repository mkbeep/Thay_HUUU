/**
 * Error Handling Middleware
 * Xử lý tất cả errors trong application
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../application/errors/AppError';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const grpcCode = (err as Error & { code?: number }).code;
  const isQuotaError =
    grpcCode === 8 ||
    err.message.includes('RESOURCE_EXHAUSTED') ||
    err.message.toLowerCase().includes('quota exceeded');

  // Log error
  console.error('❌ Error:', {
    message: err.message,
    stack: isQuotaError ? undefined : err.stack,
    path: req.path,
    method: req.method,
  });

  if (isQuotaError) {
    return res.status(429).json({
      success: false,
      message: 'Firebase/Firestore đã vượt quota. Vui lòng đợi quota reset hoặc giảm tần suất gọi API.',
      statusCode: 429,
    });
  }

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: err.message,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn',
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi server',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};
