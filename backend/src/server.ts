/**
 * Server Entry Point
 * Khởi tạo và cấu hình Express server
 */

import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config, validateEnv } from './infrastructure/config/env.config';
import createRoutes from './presentation/routes';
import { errorMiddleware } from './presentation/middlewares/errorMiddleware';
import { SocketManager } from './infrastructure/websocket/SocketManager';

// Validate environment variables
try {
  validateEnv();
} catch (error) {
  console.error(error);
  process.exit(1);
}

// Create Express app
const app: Application = express();
// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
const socketManager = SocketManager.initialize(httpServer);

// Dynamic API data should not use ETag/304 in admin polling screens
app.set('etag', false);

// Security middleware - Cấu hình để cho phép load ảnh
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// CORS — cho phép LAN (192.168.x / 10.x) khi dev để điện thoại mở http://IP:8081 vẫn gọi được API
const corsStaticOrigins = Array.isArray(config.cors.origin)
  ? config.cors.origin
  : [config.cors.origin].filter(Boolean) as string[];

function isLanHttpOrigin(origin: string): boolean {
  return /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(
    origin
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsStaticOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (config.server.env !== 'production' && isLanHttpOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau',
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Disable cache for API responses to avoid stale 304 on real-time screens
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Logging
if (config.server.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ========================================
// SERVE STATIC FILES - Menu Images
// ========================================
const menuImagesPath = path.join(__dirname, '../../App/assets/images/menu');
app.use('/images/menu', express.static(menuImagesPath, {
  maxAge: '1d', // Cache 1 ngày
  etag: true,
  lastModified: true,
}));

console.log(`📸 Serving menu images from: ${menuImagesPath}`);
console.log(`🔗 Image URL format: http://localhost:${config.server.port}/images/menu/{category}/{filename}`);

// API routes - Truyền socketManager vào routes
app.use(`/api/${config.server.apiVersion}`, createRoutes(socketManager));

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Restaurant Management System API',
    version: config.server.apiVersion,
    environment: config.server.env,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint không tồn tại',
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server
const PORT = config.server.port;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 Restaurant Management System API');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${config.server.env}`);
  console.log(`📝 API Version: ${config.server.apiVersion}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`🔗 Network: http://192.168.1.3:${PORT}`);
  console.log(`🏥 Health check: http://192.168.1.3:${PORT}/api/${config.server.apiVersion}/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

export default app;
