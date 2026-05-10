import { Order, OrderStatus } from '../../domain/models/Order';
import axios from 'axios';
import { API_URL } from '@env';

const API_BASE_URL = API_URL || 'http://192.168.1.3:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export class OrderRepository {
  async getAllOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get('/orders');
      return response.data.data.map(this.mapToOrder);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return this.mapToOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      return undefined;
    }
  }

  async getOrdersByTableSession(sessionId: string): Promise<Order[]> {
    try {
      const response = await apiClient.get('/orders', {
        params: { table_session_id: sessionId }
      });
      return response.data.data.map(this.mapToOrder);
    } catch (error) {
      console.error('Error fetching orders by session:', error);
      return [];
    }
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const response = await apiClient.get('/orders', {
        params: { status }
      });
      return response.data.data.map(this.mapToOrder);
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      return [];
    }
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    try {
      const response = await apiClient.post('/orders', {
        table_session_id: order.tableNumber.toString(), // TODO: Use actual session ID
        order_type: 'dine_in',
        items: order.items.map(item => ({
          food_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          notes: item.notes,
        })),
        notes: '',
      });
      return this.mapToOrder(response.data.data);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
    try {
      const response = await apiClient.patch(`/orders/${id}/status`, { status });
      return this.mapToOrder(response.data.data);
    } catch (error) {
      console.error('Error updating order status:', error);
      return undefined;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/orders/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  private mapToOrder = (data: any): Order => {
    return {
      id: data.id,
      tableNumber: data.table_session_id || 0, // TODO: Map from session to table number
      items: data.items || [],
      status: data.status as OrderStatus,
      createdAt: new Date(data.created_at),
      totalAmount: data.total_amount,
    };
  }
}
