/**
 * Food Repository Interface - Domain Layer
 */

import { Food, FoodWithImages, FoodCategory } from '../entities/Food';

export interface IFoodRepository {
  findById(id: string): Promise<Food | null>;
  findByIdWithImages(id: string): Promise<FoodWithImages | null>;
  findAll(filters?: {
    category?: FoodCategory;
    is_available?: boolean;
    is_vegetarian?: boolean;
    search?: string;
  }): Promise<Food[]>;
  findAllWithImages(filters?: {
    category?: FoodCategory;
    is_available?: boolean;
  }): Promise<FoodWithImages[]>;
  create(food: Omit<Food, 'id' | 'created_at' | 'updated_at'>): Promise<Food>;
  update(id: string, data: Partial<Food>): Promise<Food>;
  delete(id: string): Promise<void>;
  updateAvailability(id: string, isAvailable: boolean): Promise<Food>;
}
