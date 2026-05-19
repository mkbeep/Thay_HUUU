/**
 * Staff Routes
 */

import { Router } from 'express';
import { StaffController } from '../controllers/StaffController';
import { authMiddleware, requireRole } from '../middlewares/authMiddleware';

const router = Router();
const controller = new StaffController();

const staffManagers = ['admin', 'manager'] as const;

router.use(authMiddleware);
router.use(requireRole(...staffManagers));

router.get('/stats/active-count', controller.getActiveCount);
router.get('/', controller.getDirectory);
router.get('/roles', controller.getRoles);
router.post('/', controller.createStaff);
router.patch('/:id/role', controller.updateRole);

export default router;
