/**
 * Order Repository Interface - Domain Layer
 */

import { Order, OrderWithItems, OrderStatus, OrderType } from '../entities/Order';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByIdWithItems(id: string): Promise<OrderWithItems | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findAll(filters?: {
    status?: OrderStatus;
    order_type?: OrderType;
    table_session_id?: string;
    customer_id?: string;
    from_date?: Date;
    to_date?: Date;
  }): Promise<Order[]>;
  create(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  delete(id: string): Promise<void>;
  generateOrderNumber(): Promise<string>;
}
