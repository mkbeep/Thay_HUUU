/**
 * Inventory (Material) Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { InventoryController } from '../controllers/InventoryController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';

const router = Router();
const inventoryController = new InventoryController();

const createMaterialValidation = [
  body('name').notEmpty().withMessage('Tên nguyên liệu không được để trống'),
  body('category').notEmpty().withMessage('Danh mục không được để trống'),
  body('minimum').isNumeric().withMessage('Mức tối thiểu phải là số'),
  body('import.price').isNumeric().withMessage('Giá nhập phải là số'),
  body('import.quantity').isNumeric().withMessage('Số lượng nhập phải là số'),
  body('import.supplier').notEmpty().withMessage('Nhà cung cấp không được để trống'),
];

const addImportValidation = [
  body('price').isNumeric().withMessage('Giá nhập phải là số'),
  body('quantity').isNumeric().withMessage('Số lượng nhập phải là số'),
  body('supplier').notEmpty().withMessage('Nhà cung cấp không được để trống'),
];

const addExportValidation = [
  body('quantity').isNumeric().withMessage('Số lượng xuất phải là số'),
];

router.use(authMiddleware);
router.use(requireRole('staff', 'manager', 'admin'));

router.get('/stats', inventoryController.getStats);
router.get('/alerts', inventoryController.getAlerts);
router.get('/', inventoryController.getAll);
router.get('/:id/history', inventoryController.getHistory);
router.get('/:id', inventoryController.getById);
router.post('/', validate(createMaterialValidation), inventoryController.create);
router.post(
  '/:id/import',
  validate(addImportValidation),
  inventoryController.addImport
);
router.post(
  '/:id/export',
  validate(addExportValidation),
  inventoryController.addExport
);

export default router;
