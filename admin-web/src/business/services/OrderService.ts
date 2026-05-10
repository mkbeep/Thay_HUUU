/**
 * Order Service - Admin Web
 * Business logic layer
 */

import { OrderRepository, Order, OrderFilters } from '../../data/repositories/OrderRepository';

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  /**
   * Lấy danh sách đơn hàng theo trạng thái
   */
  async getOrdersByStatus(status?: Order['status']): Promise<Order[]> {
    const filters: OrderFilters = status ? { status } : {};
    return await this.orderRepository.getAll(filters);
  }

  /**
   * Lấy đơn hàng đang chờ (incoming)
   */
  async getIncomingOrders(): Promise<Order[]> {
    return await this.orderRepository.getAll({ status: 'pending' });
  }

  /**
   * Lấy đơn hàng đang nấu (preparing)
   */
  async getPreparingOrders(): Promise<Order[]> {
    return await this.orderRepository.getAll({ status: 'preparing' });
  }

  /**
   * Lấy đơn hàng sẵn sàng (ready)
   */
  async getReadyOrders(): Promise<Order[]> {
    return await this.orderRepository.getAll({ status: 'ready' });
  }

  /**
   * ✅ Bếp nhận đơn: pending → confirmed
   */
  async confirmOrder(orderId: string): Promise<Order> {
    return await this.orderRepository.updateStatus(orderId, 'confirmed');
  }

  /**
   * ✅ Bếp bắt đầu nấu: confirmed → preparing
   */
  async startPreparing(orderId: string): Promise<Order> {
    return await this.orderRepository.updateStatus(orderId, 'preparing');
  }

  /**
   * ✅ Bếp hoàn thành: preparing → ready
   */
  async markAsReady(orderId: string): Promise<Order> {
    return await this.orderRepository.updateStatus(orderId, 'ready');
  }

  /**
   * ✅ Phục vụ giao bàn: ready → served
   */
  async markAsServed(orderId: string): Promise<Order> {
    return await this.orderRepository.updateStatus(orderId, 'served');
  }

  /**
   * ✅ Thu ngân xác nhận thanh toán: served → completed (paid)
   */
  async confirmPayment(orderId: string, paymentMethod: string = 'cash'): Promise<Order> {
    return await this.orderRepository.confirmPayment(orderId, paymentMethod);
  }

  /**
   * Xóa đơn hàng
   */
  async deleteOrder(orderId: string): Promise<void> {
    return await this.orderRepository.delete(orderId);
  }

  /**
   * Tính thời gian đã trôi qua (phút)
   */
  calculateTimeElapsed(createdAt: string): number {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    return Math.floor(diffMs / 60000); // Convert to minutes
  }

  /**
   * Tính progress cho đơn đang nấu (0-100%)
   */
  calculateProgress(createdAt: string, estimatedMinutes: number = 20): number {
    const elapsed = this.calculateTimeElapsed(createdAt);
    const progress = Math.min((elapsed / estimatedMinutes) * 100, 100);
    return Math.round(progress);
  }
}
