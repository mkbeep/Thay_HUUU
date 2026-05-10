/**
 * Food Controller - Presentation Layer
 * Xử lý HTTP requests liên quan đến món ăn
 */

import { Request, Response, NextFunction } from 'express';
import { FoodRepository } from '../../infrastructure/database/repositories/FoodRepository';
import { NotFoundError } from '../../application/errors/AppError';

const normalizeCategory = (category?: string): string => {
  const value = (category || '').toString().trim().toLowerCase();
  const map: Record<string, string> = {
    appetizer: 'appetizer',
    'khai vị': 'appetizer',
    'khai vi': 'appetizer',
    main_course: 'main_course',
    main: 'main_course',
    'món chính': 'main_course',
    'mon chinh': 'main_course',
    dessert: 'dessert',
    'tráng miệng': 'dessert',
    'trang mieng': 'dessert',
    beverage: 'beverage',
    drink: 'beverage',
    drinks: 'beverage',
    'đồ uống': 'beverage',
    'do uong': 'beverage',
    special: 'special',
    specials: 'special',
    'đặc biệt': 'special',
    'dac biet': 'special',
  };
  return map[value] || value;
};

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

      const normalizedCategory = normalizeCategory(category as string);
      const foods = await this.foodRepository.findAllWithImages({
        // Không filter category ở Firestore để tránh miss dữ liệu cũ dùng category tiếng Việt
        is_available: is_available === 'true' ? true : is_available === 'false' ? false : undefined,
      });
      const filteredFoods = normalizedCategory
        ? foods.filter((food) => normalizeCategory(food.category as unknown as string) === normalizedCategory)
        : foods;

      res.status(200).json({
        success: true,
        data: filteredFoods,
        total: filteredFoods.length,
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
