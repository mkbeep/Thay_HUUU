/**
 * Order Repository - Admin Web
 * Nối vào backend thật, không dùng mock
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface OrderItem {
  id: string;
  food_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  food?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

export interface Order {
  id: string;
  order_number: string;
  table_session_id?: string;
  customer_id?: string;
  staff_id?: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  items?: OrderItem[];
}

export interface OrderFilters {
  status?: string;
  order_type?: string;
  table_session_id?: string;
  from_date?: string;
  to_date?: string;
}

export class OrderRepository {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Lấy danh sách đơn hàng
   */
  async getAll(filters?: OrderFilters): Promise<Order[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.order_type) params.append('order_type', filters.order_type);
      if (filters?.table_session_id) params.append('table_session_id', filters.table_session_id);
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);

      const response = await axios.get(`${API_URL}/orders?${params.toString()}`, {
        headers: this.getAuthHeaders(),
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết đơn hàng
   */
  async getById(id: string): Promise<Order> {
    try {
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: this.getAuthHeaders(),
      });

      return response.data.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  /**
   * ✅ Cập nhật trạng thái đơn hàng (chỉ staff/manager/admin)
   * Flow: pending → confirmed → preparing → ready → served
   */
  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    try {
      const response = await axios.patch(
        `${API_URL}/orders/${id}/status`,
        { status },
        { headers: this.getAuthHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * ✅ Xác nhận thanh toán (chỉ admin/manager)
   * Chuyển từ served → completed (paid)
   */
  async confirmPayment(id: string, paymentMethod: string = 'cash'): Promise<Order> {
    try {
      const response = await axios.post(
        `${API_URL}/orders/${id}/confirm-payment`,
        { payment_method: paymentMethod },
        { headers: this.getAuthHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Xóa đơn hàng (chỉ admin/manager)
   */
  async delete(id: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/orders/${id}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }
}
