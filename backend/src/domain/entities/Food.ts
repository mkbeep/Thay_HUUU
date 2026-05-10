/**
 * Food Entity - Domain Layer
 */

export enum FoodCategory {
  APPETIZER = 'appetizer',
  MAIN_COURSE = 'main_course',
  DESSERT = 'dessert',
  BEVERAGE = 'beverage',
  SIDE_DISH = 'side_dish',
  SPECIAL = 'special'
}

export interface Food {
  id: string;
  name: string;
  description?: string;
  category: FoodCategory;
  base_price: number;
  is_available: boolean;
  preparation_time: number; // in minutes
  calories?: number;
  is_vegetarian: boolean;
  is_spicy: boolean;
  allergens?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface FoodImage {
  id: string;
  food_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  uploaded_at: Date;
}

export interface FoodTopping {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export type FoodWithImages = Food & {
  images: FoodImage[];
  toppings?: FoodTopping[];
};
