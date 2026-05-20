/**
 * Error Handling Middleware
 * Xử lý tất cả errors trong application
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../application/errors/AppError';
import { isFirestoreQuotaError, markFirestoreQuotaExceeded } from './firestoreQuotaMiddleware';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const quotaError = isFirestoreQuotaError(err);
  const grpcMetadata =
    typeof (err as any).metadata?.getMap === 'function'
      ? (err as any).metadata.getMap()
      : undefined;
  if (quotaError) {
    console.error('Firestore quota diagnostics:', {
      message: err.message,
      code: (err as any).code,
      details: (err as any).details,
      metadata: grpcMetadata,
      projectId: process.env.FIREBASE_PROJECT_ID,
      path: req.path,
      method: req.method,
    });
  }
  // Log error
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

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

  if (quotaError) {
    markFirestoreQuotaExceeded();
    return res.status(429).json({
      success: false,
      message: 'Firestore quota da vuot gioi han. Vui long doi quota reset hoac chuyen Firebase project/plan khac.',
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi server',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};
