/**
 * Food Controller - Presentation Layer
 * Xử lý HTTP requests liên quan đến món ăn
 */

import { Request, Response, NextFunction } from 'express';
import { FoodRepository } from '../../infrastructure/database/repositories/FoodRepository';
import { NotFoundError } from '../../application/errors/AppError';
import { CloudinaryService } from '../../infrastructure/services/CloudinaryService';

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

  private buildFoodPayload(body: Request['body']) {
    return {
      name: body.name,
      description: body.description,
      category: body.category,
      base_price: body.base_price !== undefined ? Number(body.base_price) : undefined,
      is_available: body.is_available !== undefined
        ? body.is_available === true || body.is_available === 'true'
        : undefined,
      preparation_time: body.preparation_time !== undefined ? Number(body.preparation_time) : undefined,
      is_vegetarian: body.is_vegetarian !== undefined
        ? body.is_vegetarian === true || body.is_vegetarian === 'true'
        : undefined,
      is_spicy: body.is_spicy !== undefined
        ? body.is_spicy === true || body.is_spicy === 'true'
        : undefined,
    };
  }

  private stripUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
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
      const food = await this.foodRepository.create(
        this.stripUndefined(this.buildFoodPayload(req.body)) as any
      );

      const file = req.file;
      if (file) {
        const uploaded = await CloudinaryService.uploadFoodImage(file, food.id, food.category);
        await this.foodRepository.createImage(food.id, uploaded.secure_url, uploaded.public_id);
      }

      const foodWithImages = await this.foodRepository.findByIdWithImages(food.id);

      res.status(201).json({
        success: true,
        message: 'Tạo món ăn thành công',
        data: foodWithImages || food,
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
      const food = await this.foodRepository.update(
        id,
        this.stripUndefined(this.buildFoodPayload(req.body))
      );

      const shouldRemoveImage = req.body.remove_image === true || req.body.remove_image === 'true';
      if (shouldRemoveImage) {
        await this.foodRepository.deleteImages(id, true);
      }

      const file = req.file;
      if (file) {
        const uploaded = await CloudinaryService.uploadFoodImage(file, id, food.category);
        await this.foodRepository.replacePrimaryImage(id, uploaded.secure_url, uploaded.public_id);
      } else if (!shouldRemoveImage && req.body.category !== undefined) {
        await this.foodRepository.movePrimaryImageToCategory(id, food.category);
      }

      const foodWithImages = await this.foodRepository.findByIdWithImages(id);

      res.status(200).json({
        success: true,
        message: 'Cập nhật món ăn thành công',
        data: foodWithImages || food,
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
