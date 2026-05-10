/**
 * Main Routes Index
 * Tập hợp tất cả routes của application
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import foodRoutes from './food.routes';
import notificationRoutes from './notification.routes';
import orderRoutes from './order.routes';
import tableRoutes from './table.routes';
import inventoryRoutes from './inventory.routes';
import supportRequestRoutes from './support-request.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/foods', foodRoutes);
router.use('/notifications', notificationRoutes);
router.use('/orders', orderRoutes);
router.use('/tables', tableRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/support-requests', supportRequestRoutes);

export default router;
