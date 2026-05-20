/**
 * Food Routes
 */

import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { FoodController } from '../controllers/FoodController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';

const router = Router();
const foodController = new FoodController();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Chỉ cho phép tải ảnh'));
      return;
    }
    cb(null, true);
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
  imageUpload.single('image'),
  validate(createFoodValidation),
  foodController.create
);

router.put(
  '/:id',
  authMiddleware,
  requireRole('admin', 'manager'),
  imageUpload.single('image'),
  foodController.update
);

router.patch(
  '/:id/image',
  authMiddleware,
  requireRole('admin', 'manager'),
  imageUpload.single('image'),
  foodController.updateImage
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
