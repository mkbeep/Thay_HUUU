/**
 * Inventory Controller - Presentation Layer
 */

import { Request, Response, NextFunction } from 'express';
import { InventoryRepository } from '../../infrastructure/database/repositories/InventoryRepository';
import { NotFoundError } from '../../application/errors/AppError';

export class InventoryController {
  private inventoryRepository: InventoryRepository;

  constructor() {
    this.inventoryRepository = new InventoryRepository();
  }

  /**
   * GET /api/v1/inventory
   */
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, low_stock, search } = req.query;

      const items = await this.inventoryRepository.findAll({
        category: category as string,
        low_stock: low_stock === 'true',
        search: search as string,
      });

      res.status(200).json({
        success: true,
        data: items,
        total: items.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/inventory/low-stock
   */
  getLowStock = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.inventoryRepository.findLowStockItems();

      res.status(200).json({
        success: true,
        data: items,
        total: items.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/inventory/:id
   */
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.inventoryRepository.findById(id);

      if (!item) {
        throw new NotFoundError('Nguyên liệu không tồn tại');
      }

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/inventory/:id/transactions
   */
  getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { limit } = req.query;

      const transactions = await this.inventoryRepository.findTransactionsByInventoryId(
        id,
        limit ? parseInt(limit as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: transactions,
        total: transactions.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/inventory
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.inventoryRepository.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Tạo nguyên liệu thành công',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/inventory/:id
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.inventoryRepository.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Cập nhật nguyên liệu thành công',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/inventory/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.inventoryRepository.delete(id);

      res.status(200).json({
        success: true,
        message: 'Xóa nguyên liệu thành công',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/inventory/:id/quantity
   */
  updateQuantity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { quantity, transaction_type, notes } = req.body;

      // Update quantity
      const item = await this.inventoryRepository.updateQuantity(id, quantity);

      // Create transaction record
      await this.inventoryRepository.createTransaction({
        inventory_id: id,
        transaction_type,
        quantity,
        notes,
        created_by: req.user!.userId,
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật số lượng thành công',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };
}
