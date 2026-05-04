import { Order, OrderStatus, CreateOrderDto, UpdateOrderDto } from '../../domain/models/Order';

// Mock data
const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    tableNumber: 5,
    items: [
      {
        id: '1',
        menuItemId: '1',
        menuItemName: 'Phở Bò',
        quantity: 2,
        price: 65000,
      },
    ],
    status: OrderStatus.PREPARING,
    totalAmount: 130000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class OrderRepository {
  private orders: Order[] = [...MOCK_ORDERS];

  async getAllOrders(): Promise<Order[]> {
    await this.delay(300);
    return Promise.resolve([...this.orders]);
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    await this.delay(200);
    return Promise.resolve(this.orders.find(order => order.id === id));
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    await this.delay(300);
    return Promise.resolve(this.orders.filter(order => order.status === status));
  }

  async getOrdersByTable(tableNumber: number): Promise<Order[]> {
    await this.delay(300);
    return Promise.resolve(this.orders.filter(order => order.tableNumber === tableNumber));
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    await this.delay(500);
    const totalAmount = dto.items.reduce((sum, item) => sum + (item.quantity * 50000), 0);
    const newOrder: Order = {
      id: Date.now().toString(),
      tableNumber: dto.tableNumber,
      items: dto.items.map(item => ({
        id: Date.now().toString(),
        menuItemId: item.menuItemId,
        menuItemName: 'Menu Item',
        quantity: item.quantity,
        price: 50000,
        notes: item.notes,
      })),
      status: OrderStatus.PENDING,
      totalAmount,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      notes: dto.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.push(newOrder);
    return Promise.resolve(newOrder);
  }

  async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order | undefined> {
    await this.delay(500);
    const index = this.orders.findIndex(order => order.id === id);
    if (index !== -1) {
      this.orders[index] = {
        ...this.orders[index],
        ...dto,
        updatedAt: new Date(),
      };
      if (dto.status === OrderStatus.COMPLETED) {
        this.orders[index].completedAt = new Date();
      }
      return Promise.resolve(this.orders[index]);
    }
    return Promise.resolve(undefined);
  }

  async deleteOrder(id: string): Promise<boolean> {
    await this.delay(500);
    const index = this.orders.findIndex(order => order.id === id);
    if (index !== -1) {
      this.orders.splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
