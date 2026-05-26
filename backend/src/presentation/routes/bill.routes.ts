/**
 * Bill Routes
 */

import { Router } from 'express';
import { BillController } from '../controllers/BillController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';

const router = Router();
const billController = new BillController();

router.get(
  '/pending',
  authMiddleware,
  requireRole('admin', 'manager', 'staff', 'cashier'),
  billController.listPending
);

router.patch(
  '/:id/confirm-payment',
  authMiddleware,
  requireRole('admin', 'manager', 'staff', 'cashier'),
  billController.confirmPayment
);

export default router;
