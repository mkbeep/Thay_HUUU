/**
 * Order Entity - Domain Layer
 */

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery'
}

export interface Order {
  id: string;
  order_number: string;
  table_session_id?: string;
  customer_id?: string;
  staff_id?: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  food_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemTopping {
  id: string;
  order_item_id: string;
  topping_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type OrderWithItems = Order & {
  items: (OrderItem & {
    food: any;
    toppings: OrderItemTopping[];
  })[];
};
