/**
 * Promotion Entity - Domain Layer
 */

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  BUY_X_GET_Y = 'buy_x_get_y',
  FREE_ITEM = 'free_item'
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  applicable_food_ids?: string[];
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  usage_limit?: number;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}
