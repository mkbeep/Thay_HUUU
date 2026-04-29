import { MenuItem } from './MenuItem';

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  totalAmount: number;
  currentOrderId?: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export enum OrderStatus {
  PENDING = 'Chờ xử lý',
  PREPARING = 'Đang chuẩn bị',
  READY = 'Sẵn sàng',
  COMPLETED = 'Hoàn thành',
  CANCELLED = 'Đã hủy',
}
