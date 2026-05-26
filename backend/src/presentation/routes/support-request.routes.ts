/**
 * Support Request Routes
 */

import { Router } from 'express';
import { SupportRequestController } from '../controllers/SupportRequestController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/role.middleware';

const router = Router();
const controller = new SupportRequestController();

// Public routes (khách hàng có thể tạo request mà không cần đăng nhập)
router.post('/', controller.create);

// Protected routes (cần authentication)
router.get('/', authMiddleware, roleMiddleware(['admin', 'staff', 'waiter', 'manager', 'cashier', 'chef']), controller.getAll);
router.get('/pending', authMiddleware, roleMiddleware(['admin', 'staff', 'waiter', 'manager', 'cashier', 'chef']), controller.getPending);
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'staff', 'waiter', 'manager', 'cashier', 'chef']), controller.getById);
router.patch('/:id', authMiddleware, roleMiddleware(['admin', 'staff', 'waiter', 'manager', 'cashier', 'chef']), controller.update);
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'manager']), controller.delete);

export default router;
