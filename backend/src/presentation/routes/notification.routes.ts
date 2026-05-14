/**
 * Notification Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';

const router = Router();
const notificationController = new NotificationController();

// Validation rules
const sendNotificationValidation = [
  body('user_id').notEmpty().withMessage('User ID không được để trống'),
  body('type').notEmpty().withMessage('Loại notification không được để trống'),
  body('title').notEmpty().withMessage('Tiêu đề không được để trống'),
  body('message').notEmpty().withMessage('Nội dung không được để trống'),
];

const broadcastValidation = [
  body('type').notEmpty().withMessage('Loại notification không được để trống'),
  body('title').notEmpty().withMessage('Tiêu đề không được để trống'),
  body('message').notEmpty().withMessage('Nội dung không được để trống'),
];

// All routes require authentication
router.use(authMiddleware);

// User routes
router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

// Admin routes
router.post(
  '/send',
  requireRole('admin', 'manager'),
  validate(sendNotificationValidation),
  notificationController.sendNotification
);

router.post(
  '/broadcast',
  requireRole('admin'),
  validate(broadcastValidation),
  notificationController.sendBroadcast
);

export default router;
