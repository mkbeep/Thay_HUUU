/**
 * Reports Routes
 */
import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';

const router = Router();
const reportController = new ReportController();

router.use(authMiddleware);
router.use(requireRole('staff', 'manager', 'admin'));

router.get('/analytics', reportController.getAnalytics);

export default router;
