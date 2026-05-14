/**
 * Media upload routes
 */

import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';
import { MediaController, menuImageUploadMiddleware } from '../controllers/MediaController';

const router = Router();
const mediaController = new MediaController();

router.post(
  '/menu-image',
  authMiddleware,
  requireRole('admin', 'manager'),
  menuImageUploadMiddleware,
  mediaController.uploadMenuImage
);

export default router;
