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

// All routes require authentication
router.use(authMiddleware);

// Routes
router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);
router.post('/', validate(createOrderValidation), orderController.create);
router.patch('/:id/status', orderController.updateStatus);
router.delete('/:id', requireRole('admin', 'manager'), orderController.delete);

export default router;
