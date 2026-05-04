import { MenuItem, MenuCategory, CreateMenuItemDto, UpdateMenuItemDto } from '../../domain/models/MenuItem';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class MenuRepository {
  async getAllMenuItems(): Promise<MenuItem[]> {
    try {
      const response = await apiClient.get('/foods');
      return response.data.data.map(this.mapToMenuItem.bind(this));
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
      const response = await apiClient.get('/foods', { params: { category } });
      return response.data.data.map(this.mapToMenuItem.bind(this));
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      return [];
    }
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const response = await apiClient.post('/foods', {
      name: dto.name,
      description: dto.description,
      category: dto.category,
      base_price: dto.price,
      is_available: true,
      preparation_time: dto.preparationTime || 15,
      is_vegetarian: dto.isVegetarian || false,
      is_spicy: dto.isSpicy || false,
    });
    return this.mapToMenuItem(response.data.data);
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItem | undefined> {
    try {
      const response = await apiClient.put(`/foods/${id}`, {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        base_price: dto.price,
        preparation_time: dto.preparationTime,
        is_vegetarian: dto.isVegetarian,
        is_spicy: dto.isSpicy,
      });
      return this.mapToMenuItem(response.data.data);
    } catch (error) {
      console.error('Error updating menu item:', error);
      return undefined;
    }
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/foods/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }
  }

  async searchMenuItems(query: string): Promise<MenuItem[]> {
    try {
      const response = await apiClient.get('/foods', { params: { search: query } });
      return response.data.data.map(this.mapToMenuItem.bind(this));
    } catch (error) {
      console.error('Error searching menu items:', error);
      return [];
    }
  }

  private mapToMenuItem(data: any): MenuItem {
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: data.base_price,
      category: data.category as MenuCategory,
      available: data.is_available,
      preparationTime: data.preparation_time,
      isVegetarian: data.is_vegetarian,
      isSpicy: data.is_spicy,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }
}
