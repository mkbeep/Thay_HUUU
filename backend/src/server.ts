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
import { isAllowedCorsOrigin } from './infrastructure/config/corsOrigins';
import createRoutes from './presentation/routes';
import { errorMiddleware } from './presentation/middlewares/errorMiddleware';
import { SocketManager } from './infrastructure/websocket/SocketManager';
import { firestoreQuotaMiddleware } from './presentation/middlewares/firestoreQuotaMiddleware';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from 'fs';

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

// CORS — LAN + ngrok khi dev (khách quét QR từ điện thoại / admin web)
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedCorsOrigin(origin));
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

// Stop hammering Firestore for a short window after quota is exhausted.
app.use('/api', firestoreQuotaMiddleware);

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

const uploadedImagesPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadedImagesPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
}));

console.log(`📸 Serving menu images from: ${menuImagesPath}`);
console.log(`📸 Serving uploaded images from: ${uploadedImagesPath}`);
console.log(`🔗 Image URL format: http://localhost:${config.server.port}/images/menu/{category}/{filename}`);

// API routes - Truyền socketManager vào routes
app.use(`/api/${config.server.apiVersion}`, createRoutes(socketManager));

// Static web khách (sau khi `cd App && npm run build:web-app`)
const customerWebAppPath = path.join(__dirname, '../../App/web-app');
if (fs.existsSync(path.join(customerWebAppPath, 'index.html'))) {
  app.use(express.static(customerWebAppPath, { index: 'index.html' }));
  console.log(`🌐 Serving customer web-app from: ${customerWebAppPath}`);
}

// Dev: proxy trang khách (Expo :8081) qua cùng cổng API — 1 URL ngrok cho QR + API
if (config.customerWeb.proxyEnabled) {
  const expoProxy = createProxyMiddleware({
    target: config.customerWeb.proxyTarget,
    changeOrigin: true,
    ws: true,
  });

  app.use((req, res, next) => {
    const p = req.path;
    if (
      p.startsWith('/api') ||
      p.startsWith('/images') ||
      p.startsWith('/uploads') ||
      p.startsWith('/socket.io')
    ) {
      return next();
    }
    return expoProxy(req, res, next);
  });
  console.log(
    `🔀 Customer web proxy: ${config.customerWeb.proxyTarget} (Expo phải đang chạy :8081)`
  );
}

// Root endpoint (chỉ khi không proxy / không có web-app)
app.get('/', (_req, res, next) => {
  if (config.customerWeb.proxyEnabled || fs.existsSync(path.join(customerWebAppPath, 'index.html'))) {
    return next();
  }
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
  console.log(`🔗 Network: http://192.168.1.8:${PORT}`);
  console.log(`🏥 Health check: http://192.168.1.8:${PORT}/api/${config.server.apiVersion}/health`);
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
