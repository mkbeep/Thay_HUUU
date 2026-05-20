/**
 * Food Controller - Presentation Layer
 * Xử lý HTTP requests liên quan đến món ăn
 */

import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { FoodRepository } from '../../infrastructure/database/repositories/FoodRepository';
import { NotFoundError } from '../../application/errors/AppError';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

const normalizeFoodPayload = (payload: Record<string, any>): Record<string, any> => {
  const normalized = { ...payload };

  ['base_price', 'preparation_time', 'calories'].forEach((key) => {
    if (normalized[key] !== undefined) {
      normalized[key] = Number(normalized[key]);
    }
  });

  ['is_available', 'is_vegetarian', 'is_spicy'].forEach((key) => {
    if (normalized[key] !== undefined) {
      normalized[key] = normalized[key] === true || normalized[key] === 'true';
    }
  });

  return normalized;
};

const getCloudinaryPublicId = (imageUrl?: string): string | undefined => {
  if (!imageUrl || !process.env.CLOUDINARY_CLOUD_NAME) return undefined;

  try {
    const url = new URL(imageUrl);
    if (url.hostname !== 'res.cloudinary.com') return undefined;

    const parts = url.pathname.split('/').filter(Boolean);
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex < 0) return undefined;

    const afterUpload = parts.slice(uploadIndex + 1);
    const versionIndex = afterUpload.findIndex((part) => /^v\d+$/.test(part));
    const publicPathParts = versionIndex >= 0 ? afterUpload.slice(versionIndex + 1) : afterUpload;
    if (publicPathParts.length === 0) return undefined;

    const publicPath = publicPathParts.join('/');
    return publicPath.replace(/\.[^.]+$/, '');
  } catch {
    return undefined;
  }
};

const categoryToCloudinaryFolder = (category?: string): string => {
  const normalized = normalizeCategory(category);
  const map: Record<string, string> = {
    appetizer: 'appetizers',
    main_course: 'main-courses',
    dessert: 'desserts',
    beverage: 'beverages',
    special: 'specials',
  };
  return map[normalized] || 'uncategorized';
};

const getCloudinaryMenuFolder = (category?: string): string =>
  `menu/${categoryToCloudinaryFolder(category)}`;

const uploadFoodImageToCloudinary = async (
  file: Express.Multer.File,
  foodId: string,
  category?: string,
  currentImageUrl?: string
): Promise<string> => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Thiếu cấu hình Cloudinary để upload ảnh món ăn');
  }

  const previousPublicId = getCloudinaryPublicId(currentImageUrl);
  const folder = getCloudinaryMenuFolder(category);

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: foodId,
        asset_folder: folder,
        resource_type: 'image',
        overwrite: true,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, uploadResult) => {
        if (error || !uploadResult?.secure_url) {
          reject(error || new Error('Cloudinary không trả về URL ảnh'));
          return;
        }
        resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        });
      }
    );
    stream.end(file.buffer);
  });

  if (previousPublicId && previousPublicId !== result.public_id) {
    void cloudinary.uploader.destroy(previousPublicId).catch((destroyError) => {
      console.warn('[Cloudinary] Could not delete previous menu image', {
        foodId,
        previousPublicId,
        error: destroyError,
      });
    });
  }

  return result.secure_url;
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
      const { image_url, ...foodPayload } = req.body;
      const food = await this.foodRepository.create(normalizeFoodPayload(foodPayload) as any);
      const uploadedImageUrl = req.file
        ? await uploadFoodImageToCloudinary(req.file, food.id, food.category)
        : image_url;

      if (uploadedImageUrl) {
        await this.foodRepository.replacePrimaryImage(food.id, uploadedImageUrl);
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
      const { image_url, ...foodPayload } = req.body;
      const normalizedPayload = normalizeFoodPayload(foodPayload) as Record<string, unknown>;
      const hasFoodFields = Object.keys(normalizedPayload).length > 0;

      const existingFood = await this.foodRepository.findById(id);
      if (!existingFood) {
        throw new NotFoundError('Món ăn không tồn tại');
      }

      if (req.file) {
        const uploadCategory =
          (normalizedPayload.category as string | undefined) || existingFood.category;

        const [uploadedImageUrl, updatedFood] = await Promise.all([
          (async () => {
            const primaryImageUrl = await this.foodRepository.getPrimaryImageUrl(id);
            return uploadFoodImageToCloudinary(
              req.file!,
              id,
              uploadCategory,
              primaryImageUrl
            );
          })(),
          hasFoodFields
            ? this.foodRepository.update(id, normalizedPayload as any)
            : Promise.resolve(existingFood),
        ]);

        const primaryImage = await this.foodRepository.replacePrimaryImage(id, uploadedImageUrl);
        res.status(200).json({
          success: true,
          message: 'Cập nhật món ăn thành công',
          data: { ...updatedFood, images: [primaryImage] },
        });
        return;
      }

      let food = existingFood;
      if (hasFoodFields) {
        food = await this.foodRepository.update(id, normalizedPayload as any);
      }

      if (image_url !== undefined) {
        const primaryImage = await this.foodRepository.replacePrimaryImage(id, image_url);
        res.status(200).json({
          success: true,
          message: 'Cập nhật món ăn thành công',
          data: { ...food, images: [primaryImage] },
        });
        return;
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
   * PATCH /api/v1/foods/:id/image
   * Chỉ cập nhật ảnh — nhanh hơn PUT full update
   */
  updateImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Thiếu file ảnh' });
        return;
      }

      const food = await this.foodRepository.findById(id);
      if (!food) {
        throw new NotFoundError('Món ăn không tồn tại');
      }

      const primaryImageUrl = await this.foodRepository.getPrimaryImageUrl(id);
      const uploadedImageUrl = await uploadFoodImageToCloudinary(
        req.file,
        id,
        food.category,
        primaryImageUrl
      );
      const primaryImage = await this.foodRepository.replacePrimaryImage(id, uploadedImageUrl);

      res.status(200).json({
        success: true,
        message: 'Cập nhật ảnh thành công',
        data: { ...food, images: [primaryImage] },
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
