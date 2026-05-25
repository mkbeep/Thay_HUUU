import { MenuItem, MenuCategory, CreateMenuItemDto, UpdateMenuItemDto } from '../../domain/models/MenuItem';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
});

const API_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, '');

const normalizeCategoryToVi = (category?: string): MenuCategory => {
  const value = (category || '').toString().trim().toLowerCase();
  const map: Record<string, MenuCategory> = {
    appetizer: MenuCategory.APPETIZER,
    'khai vị': MenuCategory.APPETIZER,
    'khai vi': MenuCategory.APPETIZER,
    main_course: MenuCategory.MAIN_COURSE,
    main: MenuCategory.MAIN_COURSE,
    'món chính': MenuCategory.MAIN_COURSE,
    'mon chinh': MenuCategory.MAIN_COURSE,
    dessert: MenuCategory.DESSERT,
    'tráng miệng': MenuCategory.DESSERT,
    'trang mieng': MenuCategory.DESSERT,
    beverage: MenuCategory.BEVERAGE,
    drinks: MenuCategory.BEVERAGE,
    drink: MenuCategory.BEVERAGE,
    'đồ uống': MenuCategory.BEVERAGE,
    'do uong': MenuCategory.BEVERAGE,
    special: MenuCategory.SPECIAL,
    specials: MenuCategory.SPECIAL,
    'đặc biệt': MenuCategory.SPECIAL,
    'dac biet': MenuCategory.SPECIAL,
  };
  return map[value] || MenuCategory.MAIN_COURSE;
};

const categoryToApiValue = (category: MenuCategory): string => {
  const normalized = normalizeCategoryToVi(category);
  if (normalized === MenuCategory.APPETIZER) return 'appetizer';
  if (normalized === MenuCategory.MAIN_COURSE) return 'main_course';
  if (normalized === MenuCategory.DESSERT) return 'dessert';
  if (normalized === MenuCategory.BEVERAGE) return 'beverage';
  return 'special';
};

const resolveImageUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';

  const url = rawUrl.trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
  if (url.startsWith('/images/')) return `${API_ORIGIN}${url}`;
  if (url.startsWith('menu/')) return `${API_ORIGIN}/images/${url}`;
  return `${API_ORIGIN}/images/menu/${url.replace(/^\/+/, '')}`;
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // ✅ Fix: đổi từ 'access_token' thành 'token'
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.method?.toLowerCase() === 'get') {
    config.params = { ...(config.params || {}), _t: Date.now() };
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers.Pragma = 'no-cache';
    config.headers.Expires = '0';
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
      throw error;
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
      const response = await apiClient.get('/foods', { params: { category: categoryToApiValue(category) } });
      return response.data.data.map(this.mapToMenuItem.bind(this));
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      return [];
    }
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const payload = {
      name: dto.name,
      description: dto.description,
      category: categoryToApiValue(dto.category),
      base_price: dto.price,
      is_available: true,
      preparation_time: dto.preparationTime || 15,
      is_vegetarian: dto.isVegetarian || false,
      is_spicy: dto.isSpicy || false,
    };

    const response = dto.imageFile
      ? await apiClient.post('/foods', this.toFormData(payload, dto.imageFile))
      : await apiClient.post('/foods', payload);

    return this.mapToMenuItem(response.data.data);
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItem | undefined> {
    try {
      if (dto.available !== undefined) {
        await apiClient.patch(`/foods/${id}/availability`, {
          is_available: dto.available,
        });
      }

      const hasMainPayload = [
        dto.name,
        dto.description,
        dto.category,
        dto.price,
        dto.preparationTime,
        dto.isVegetarian,
        dto.isSpicy,
        dto.imageFile,
        dto.removeImage,
      ].some(value => value !== undefined);

      if (!hasMainPayload) {
        return this.getMenuItemById(id);
      }

      const payload = {
        name: dto.name,
        description: dto.description,
        category: dto.category ? categoryToApiValue(dto.category) : undefined,
        base_price: dto.price,
        preparation_time: dto.preparationTime,
        is_vegetarian: dto.isVegetarian,
        is_spicy: dto.isSpicy,
        remove_image: dto.removeImage,
      };

      const response = dto.imageFile
        ? await apiClient.put(`/foods/${id}`, this.toFormData(payload, dto.imageFile))
        : await apiClient.put(`/foods/${id}`, payload);

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
    // Lấy ảnh primary từ images array
    let imageUrl = '';
    if (data.images && data.images.length > 0) {
      const primaryImage = data.images.find((img: any) => img.is_primary) || data.images[0];
      imageUrl = resolveImageUrl(primaryImage.image_url);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: data.base_price,
      category: normalizeCategoryToVi(data.category),
      imageUrl: imageUrl,
      available: data.is_available,
      preparationTime: data.preparation_time,
      isVegetarian: data.is_vegetarian,
      isSpicy: data.is_spicy,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }

  private toFormData(payload: Record<string, unknown>, imageFile?: File): FormData {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return formData;
  }
}
