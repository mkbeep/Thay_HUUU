/**
 * Food Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { FoodController } from '../controllers/FoodController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { config } from '../../infrastructure/config/env.config';

const router = Router();
const foodController = new FoodController();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Chỉ cho phép upload file ảnh'));
      return;
    }
    callback(null, true);
  },
});

// Validation rules
const createFoodValidation = [
  body('name').notEmpty().withMessage('Tên món ăn không được để trống'),
  body('category').notEmpty().withMessage('Danh mục không được để trống'),
  body('base_price').isNumeric().withMessage('Giá phải là số'),
  body('preparation_time').isNumeric().withMessage('Thời gian chuẩn bị phải là số'),
];

// Public routes
router.get('/', foodController.getAll);
router.get('/:id', foodController.getById);

// Protected routes (Admin/Staff only)
router.post(
  '/',
  authMiddleware,
  requireRole('admin', 'manager'),
  upload.single('image'),
  validate(createFoodValidation),
  foodController.create
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('admin', 'manager'),
  upload.single('image'),
  foodController.update
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole('admin', 'manager'),
  foodController.delete
);

router.patch(
  '/:id/availability',
  authMiddleware,
  requireRole('admin', 'manager', 'staff'),
  foodController.updateAvailability
);

export default router;
