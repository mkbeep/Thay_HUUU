import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export interface CartLine {
  id: string;
  food_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  price_display?: string;
  note?: string;
  options?: string;
}

export class CartRepository {
  async syncCart(
    sessionId: string,
    items: (Omit<CartLine, 'id'> & { id?: string })[]
  ): Promise<CartLine[]> {
    const lines = items.map((item) => ({
      id: item.id || `line_${item.food_id}_${Date.now()}`,
      food_id: item.food_id || (item as { id?: string }).id || '',
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      price_display: item.price_display,
      note: item.note,
      options: item.options,
    }));
    const response = await api.post('/cart', { session_id: sessionId, items: lines });
    return response.data.data?.items || lines;
  }

  async getCart(sessionId: string): Promise<CartLine[]> {
    const response = await api.get(`/cart/${sessionId}`);
    return response.data.data?.items || [];
  }

  async removeItem(sessionId: string, itemId: string): Promise<CartLine[]> {
    const response = await api.delete(`/cart/${sessionId}/item/${itemId}`);
    return response.data.data?.items || [];
  }
}
