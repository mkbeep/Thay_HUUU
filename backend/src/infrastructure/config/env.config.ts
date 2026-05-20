/**
 * Environment Configuration
 * Quản lý tất cả các biến môi trường
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiVersion: process.env.API_VERSION || 'v1',
  },

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    databaseUrl: process.env.FIREBASE_DATABASE_URL || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS (admin-web 5173; Expo web khách App 8081; override với CORS_ORIGIN)
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean) || [
      'http://localhost:5173',
      'http://localhost:8081',
    ],
  },

  /** Base URL bản web khách (Expo Web export `App/web-app` — cùng giao diện app). Quét QR mở trình duyệt tới đây. */
  customerWeb: {
    baseUrl: (process.env.CUSTOMER_WEB_BASE_URL || 'http://localhost:8081').replace(/\/+$/, ''),
    /** Dev: proxy /table, /_expo, ... tới Expo (8081) qua cùng ngrok :3000 */
    proxyEnabled: process.env.CUSTOMER_WEB_PROXY === 'true',
    proxyTarget: (process.env.CUSTOMER_WEB_PROXY_TARGET || 'http://127.0.0.1:8081').replace(
      /\/+$/,
      ''
    ),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    uploadPath: process.env.UPLOAD_PATH || 'uploads',
  },

  // Notification
  notification: {
    fcmServerKey: process.env.FCM_SERVER_KEY || '',
  },

  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@restaurant.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    name: process.env.ADMIN_NAME || 'System Administrator',
  },
};

// Validate required environment variables
export const validateEnv = (): void => {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'JWT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the values.'
    );
  }
};
