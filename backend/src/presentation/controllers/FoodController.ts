/**
 * Food Controller - Presentation Layer
 * Xử lý HTTP requests liên quan đến món ăn
 */

import { Request, Response, NextFunction } from 'express';
import { FoodRepository } from '../../infrastructure/database/repositories/FoodRepository';
import { NotFoundError } from '../../application/errors/AppError';

export class FoodController {
  private foodRepository: FoodRepository;

  constructor() {
    this.foodRepository = new FoodRepository();
  }

  /**
   * GET /api/v1/foods
   * Lấy danh sách món ăn
   */
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, is_available } = req.query;
      // Note: is_vegetarian and search filters are not yet implemented in repository

      const foods = await this.foodRepository.findAllWithImages({
        category: category as any,
        is_available: is_available === 'true' ? true : is_available === 'false' ? false : undefined,
      });

      res.status(200).json({
        success: true,
        data: foods,
        total: foods.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/foods/:id
   * Lấy chi tiết món ăn
   */
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const food = await this.foodRepository.findByIdWithImages(id);

      if (!food) {
        throw new NotFoundError('Món ăn không tồn tại');
      }

      res.status(200).json({
        success: true,
        data: food,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/foods
   * Tạo món ăn mới
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const food = await this.foodRepository.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Tạo món ăn thành công',
        data: food,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/foods/:id
   * Cập nhật món ăn
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const food = await this.foodRepository.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Cập nhật món ăn thành công',
        data: food,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/foods/:id
   * Xóa món ăn
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.foodRepository.delete(id);

      res.status(200).json({
        success: true,
        message: 'Xóa món ăn thành công',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/foods/:id/availability
   * Cập nhật trạng thái available
   */
  updateAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { is_available } = req.body;

      const food = await this.foodRepository.updateAvailability(id, is_available);

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: food,
      });
    } catch (error) {
      next(error);
    }
  };
}
