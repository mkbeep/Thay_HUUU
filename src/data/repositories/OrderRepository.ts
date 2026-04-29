import { Order, OrderStatus } from '../../domain/models/Order';

export class OrderRepository {
  private orders: Order[] = [
    {
      id: '1',
      tableNumber: 5,
      items: [],
      status: OrderStatus.PREPARING,
      createdAt: new Date(),
      totalAmount: 150000,
    },
    {
      id: '2',
      tableNumber: 3,
      items: [],
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      totalAmount: 95000,
    },
  ];

  async getAllOrders(): Promise<Order[]> {
    return Promise.resolve([...this.orders]);
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return Promise.resolve(this.orders.find(order => order.id === id));
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return Promise.resolve(this.orders.filter(order => order.status === status));
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
    };
    this.orders.push(newOrder);
    return Promise.resolve(newOrder);
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
    const index = this.orders.findIndex(order => order.id === id);
    if (index !== -1) {
      this.orders[index].status = status;
      return Promise.resolve(this.orders[index]);
    }
    return Promise.resolve(undefined);
  }

  async deleteOrder(id: string): Promise<boolean> {
    const index = this.orders.findIndex(order => order.id === id);
    if (index !== -1) {
      this.orders.splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
}
