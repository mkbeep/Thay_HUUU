import { Order, OrderStatus, OrderItem } from '../../domain/models/Order';
import { OrderRepository } from '../../data/repositories/OrderRepository';

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  async getAllOrders(): Promise<Order[]> {
    return await this.orderRepository.getAllOrders();
  }

  async getActiveOrders(): Promise<Order[]> {
    const allOrders = await this.orderRepository.getAllOrders();
    return allOrders.filter(order =>
      order.status !== OrderStatus.COMPLETED &&
      order.status !== OrderStatus.CANCELLED
    );
  }

  async createOrder(tableNumber: number, items: OrderItem[]): Promise<Order> {
    const totalAmount = this.calculateTotal(items);
    return await this.orderRepository.createOrder({
      tableNumber,
      items,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      totalAmount,
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | undefined> {
    return await this.orderRepository.updateOrderStatus(orderId, status);
  }

  async cancelOrder(orderId: string): Promise<Order | undefined> {
    return await this.orderRepository.updateOrderStatus(orderId, OrderStatus.CANCELLED);
  }

  private calculateTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => {
      return total + (item.menuItem.price * item.quantity);
    }, 0);
  }

  async getOrderStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const orders = await this.orderRepository.getAllOrders();
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    return {
      totalOrders: completedOrders.length,
      totalRevenue,
      averageOrderValue,
    };
  }
}
