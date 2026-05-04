/**
 * Inventory Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { InventoryController } from '../controllers/InventoryController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';

const router = Router();
const inventoryController = new InventoryController();

// Validation rules
const createInventoryValidation = [
  body('item_name').notEmpty().withMessage('Tên nguyên liệu không được để trống'),
  body('category').notEmpty().withMessage('Danh mục không được để trống'),
  body('current_quantity').isNumeric().withMessage('Số lượng phải là số'),
  body('unit').notEmpty().withMessage('Đơn vị không được để trống'),
];

// All routes require authentication and staff role
router.use(authMiddleware);
router.use(requireRole('staff', 'manager', 'admin'));

// Routes
router.get('/', inventoryController.getAll);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/:id', inventoryController.getById);
router.get('/:id/transactions', inventoryController.getTransactions);
router.post('/', validate(createInventoryValidation), inventoryController.create);
router.put('/:id', inventoryController.update);
router.delete('/:id', requireRole('admin', 'manager'), inventoryController.delete);
router.patch('/:id/quantity', inventoryController.updateQuantity);

export default router;
