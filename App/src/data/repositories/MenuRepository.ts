import { MenuItem, MenuCategory } from '../../domain/models/MenuItem';
import axios from 'axios';

// Đọc API_URL từ .env, fallback về localhost nếu không có
const API_BASE_URL = process.env.API_URL || 'http://192.168.1.100:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export class MenuRepository {
  async getAllMenuItems(): Promise<MenuItem[]> {
    try {
      const response = await apiClient.get('/foods', {
        params: { is_available: true }
      });
      return response.data.data.map(this.mapToMenuItem);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }

  async getMenuItemById(id: string): Promise<MenuItem | undefined> {
    try {
      const response = await apiClient.get(`/foods/${id}`);
      return this.mapToMenuItem(response.data.data);
    } catch (error) {
      console.error('Error fetching menu item:', error);
      return undefined;
    }
  }

  async getMenuItemsByCategory(category: MenuCategory): Promise<MenuItem[]> {
    try {
      const response = await apiClient.get('/foods', {
        params: { category, is_available: true }
      });
      return response.data.data.map(this.mapToMenuItem);
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      return [];
    }
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | undefined> {
    try {
      const response = await apiClient.put(`/foods/${id}`, updates);
      return this.mapToMenuItem(response.data.data);
    } catch (error) {
      console.error('Error updating menu item:', error);
      return undefined;
    }
  }

  private mapToMenuItem = (data: any): MenuItem => {
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: data.base_price,
      category: data.category as MenuCategory,
      available: data.is_available,
      image: data.images?.[0]?.image_url || require('../../../assets/images/menu/1.png'),
      badge: data.is_spicy ? 'Spicy' : data.is_vegetarian ? 'Vegetarian' : undefined,
      badgeColor: data.is_spicy ? '#FF6B6B' : data.is_vegetarian ? '#51CF66' : undefined,
    };
  }
}
