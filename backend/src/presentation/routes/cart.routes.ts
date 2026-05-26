import { Router } from 'express';
import { CartController } from '../controllers/CartController';

const router = Router();
const cartController = new CartController();

router.post('/', cartController.syncCart);
router.get('/:sessionId', cartController.getCart);
router.delete('/:sessionId/item/:itemId', cartController.removeItem);

export default router;
