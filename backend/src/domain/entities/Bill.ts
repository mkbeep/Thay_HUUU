/**
 * Bill — gom toàn bộ order_item unpaid của một session thành một yêu cầu thanh toán
 */

export type BillStatus = 'pending' | 'paid' | 'cancelled';

export interface BillLineItem {
  order_item_id: string;
  order_id: string;
  food_id: string;
  food_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Bill {
  id: string;
  session_id: string;
  table_id?: string;
  table_number?: string;
  status: BillStatus;
  payment_method?: 'qr' | 'cash' | 'card' | 'e_wallet';
  items: BillLineItem[];
  subtotal?: number;
  tax_amount?: number;
  total: number;
  requested_at: Date;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}
