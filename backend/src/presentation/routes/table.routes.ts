/**
 * Table Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { TableController } from '../controllers/TableController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';

// ✅ Nhận socketManager từ server.ts
export default function createTableRoutes(socketManager: SocketManager): Router {
  const router = Router();
  const tableController = new TableController(socketManager);

  // Validation rules
  const createTableValidation = [
    body('table_number').notEmpty().withMessage('Số bàn không được để trống'),
    body('capacity').isNumeric().withMessage('Sức chứa phải là số'),
  ];

  // Public routes (không cần auth)
  router.get('/', tableController.getAll);
  router.get('/by-number/:number', tableController.getByNumber); // NEW: Get table by number
  router.get('/:id', tableController.getById);
  router.post('/:id/session', tableController.createSession);
  router.patch('/session/:sessionId/end', tableController.endSession);

  // Protected routes (cần auth)
  router.use(authMiddleware);

  router.post(
    '/',
    requireRole('admin', 'manager'),
    validate(createTableValidation),
    tableController.create
  );

  router.put(
    '/:id',
    requireRole('admin', 'manager'),
    tableController.update
  );

  router.delete(
    '/:id',
    requireRole('admin', 'manager'),
    tableController.delete
  );

  router.patch('/:id/status', requireRole('staff', 'manager', 'admin'), tableController.updateStatus);

  return router;
}
