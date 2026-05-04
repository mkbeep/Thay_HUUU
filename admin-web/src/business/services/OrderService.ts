import { Order, OrderStatus, CreateOrderDto, UpdateOrderDto } from '../../domain/models/Order';
import { OrderRepository } from '../../data/repositories/OrderRepository';

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  async getOrders(): Promise<Order[]> {
    return await this.orderRepository.getAllOrders();
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return await this.orderRepository.getOrderById(id);
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return await this.orderRepository.getOrdersByStatus(status);
  }

  async getOrdersByTable(tableNumber: number): Promise<Order[]> {
    return await this.orderRepository.getOrdersByTable(tableNumber);
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    // Validate input
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Đơn hàng phải có ít nhất 1 món');
    }
    if (dto.tableNumber <= 0) {
      throw new Error('Số bàn không hợp lệ');
    }

    return await this.orderRepository.createOrder(dto);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
    return await this.orderRepository.updateOrder(id, { status });
  }

  async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order | undefined> {
    return await this.orderRepository.updateOrder(id, dto);
  }

  async cancelOrder(id: string): Promise<Order | undefined> {
    return await this.orderRepository.updateOrder(id, { status: OrderStatus.CANCELLED });
  }

  async completeOrder(id: string): Promise<Order | undefined> {
    return await this.orderRepository.updateOrder(id, { status: OrderStatus.COMPLETED });
  }

  async deleteOrder(id: string): Promise<boolean> {
    return await this.orderRepository.deleteOrder(id);
  }

  async getActiveOrders(): Promise<Order[]> {
    const allOrders = await this.orderRepository.getAllOrders();
    return allOrders.filter(order => 
      order.status !== OrderStatus.COMPLETED && 
      order.status !== OrderStatus.CANCELLED
    );
  }

  async getPendingOrders(): Promise<Order[]> {
    return await this.orderRepository.getOrdersByStatus(OrderStatus.PENDING);
  }

  async getCompletedOrders(): Promise<Order[]> {
    return await this.orderRepository.getOrdersByStatus(OrderStatus.COMPLETED);
  }

  async getTotalRevenue(): Promise<number> {
    const completedOrders = await this.getCompletedOrders();
    return completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  }

  async getAverageOrderValue(): Promise<number> {
    const completedOrders = await this.getCompletedOrders();
    if (completedOrders.length === 0) return 0;
    const total = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    return total / completedOrders.length;
  }
}
