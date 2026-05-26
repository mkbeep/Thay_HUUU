/**
 * Order Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { OrderController } from '../controllers/OrderController';
import { BillController } from '../controllers/BillController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';

const router = Router();
const orderController = new OrderController();
const billController = new BillController();

// Validation rules
const createOrderValidation = [
  body('order_type').notEmpty().withMessage('Loại đơn hàng không được để trống'),
  body('items').isArray({ min: 1 }).withMessage('Đơn hàng phải có ít nhất 1 món'),
];

// Public routes (khách)
router.post('/', validate(createOrderValidation), orderController.create);
router.post('/request-payment-batch', orderController.requestPaymentBatch);
/** Gom toàn bộ món unpaid của session thành một bill */
router.post('/:sessionId/request-payment', billController.requestSessionPayment);
router.patch('/:id/request-payment', orderController.requestPayment);
router.patch('/:id/cancel', orderController.cancel);
router.get('/public', orderController.getPublicByTableSession);

// Protected routes
router.get('/', authMiddleware, requireRole('admin', 'manager', 'staff'), orderController.getAll);
router.patch('/items/:itemId/status', authMiddleware, requireRole('admin', 'manager', 'staff'), orderController.updateItemStatus);
router.patch('/items/:itemId/payment', authMiddleware, requireRole('admin', 'manager', 'staff', 'cashier'), orderController.updateItemPayment);
router.get('/:id', authMiddleware, requireRole('admin', 'manager', 'staff'), orderController.getById);
router.patch('/:id/status', authMiddleware, requireRole('admin', 'manager', 'staff'), orderController.updateStatus);
router.patch('/:id/confirm-payment', authMiddleware, requireRole('admin', 'manager', 'staff', 'cashier'), orderController.confirmPayment);
router.delete('/:id', authMiddleware, requireRole('admin', 'manager'), orderController.delete);

export default router;
