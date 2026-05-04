export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  notes?: string;
}

export enum OrderStatus {
  PENDING = 'Chờ xử lý',
  PREPARING = 'Đang chuẩn bị',
  READY = 'Sẵn sàng',
  SERVED = 'Đã phục vụ',
  COMPLETED = 'Hoàn thành',
  CANCELLED = 'Đã hủy',
}

export interface CreateOrderDto {
  tableNumber: number;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  notes?: string;
}
