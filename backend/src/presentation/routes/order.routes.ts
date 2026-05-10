/**
 * Order Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { OrderController } from '../controllers/OrderController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';

const router = Router();
const orderController = new OrderController();

// Validation rules
const createOrderValidation = [
  body('order_type').notEmpty().withMessage('Loại đơn hàng không được để trống'),
  body('items').isArray({ min: 1 }).withMessage('Đơn hàng phải có ít nhất 1 món'),
];

// Public routes (khách)
router.post('/', validate(createOrderValidation), orderController.create);
router.patch('/:id/request-payment', orderController.requestPayment);
router.patch('/:id/cancel', orderController.cancel);
router.get('/public', orderController.getPublicByTableSession);

// Protected routes
router.get('/', authMiddleware, requireRole('admin', 'manager', 'staff'), orderController.getAll);
router.get('/:id', authMiddleware, requireRole('admin', 'manager', 'staff'), orderController.getById);
router.patch('/:id/status', authMiddleware, requireRole('admin', 'manager', 'staff'), orderController.updateStatus);
router.patch('/:id/confirm-payment', authMiddleware, requireRole('admin', 'manager', 'cashier'), orderController.confirmPayment);
router.delete('/:id', authMiddleware, requireRole('admin', 'manager'), orderController.delete);

export default router;
