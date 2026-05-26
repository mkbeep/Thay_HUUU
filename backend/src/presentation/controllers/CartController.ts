/**
 * Cart Controller — server-side cart in Firestore "carts"
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CartRepository } from '../../infrastructure/database/repositories/CartRepository';
import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { NotFoundError } from '../../application/errors/AppError';
import { CartLine } from '../../domain/entities/Cart';

export class CartController {
  private cartRepository = new CartRepository();
  private tableRepository = new TableRepository();

  /** POST /api/v1/cart — đồng bộ toàn bộ giỏ */
  syncCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { session_id, items } = req.body as {
        session_id?: string;
        items?: CartLine[];
      };
      if (!session_id) {
        res.status(400).json({ success: false, message: 'session_id bắt buộc' });
        return;
      }
      const session = await this.tableRepository.findSessionById(session_id);
      if (!session?.is_active) {
        throw new NotFoundError('Phiên không tồn tại hoặc đã đóng');
      }
      const lines = Array.isArray(items)
        ? items.map((line) => ({ ...line, id: line.id || uuidv4() }))
        : [];
      const cart = await this.cartRepository.upsert(session_id, lines);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/cart/:sessionId */
  getCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const cart = await this.cartRepository.getBySessionId(sessionId);
      res.status(200).json({
        success: true,
        data: cart || { session_id: sessionId, items: [], updated_at: null },
      });
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /api/v1/cart/:sessionId/item/:itemId */
  removeItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, itemId } = req.params;
      const session = await this.tableRepository.findSessionById(sessionId);
      if (!session?.is_active) {
        throw new NotFoundError('Phiên không tồn tại hoặc đã đóng');
      }
      const cart = await this.cartRepository.removeItem(sessionId, itemId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  };
}
