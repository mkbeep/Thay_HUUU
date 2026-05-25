import { MenuItem, MenuCategory } from '../../domain/models/MenuItem';
import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

const resolvedBase = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: resolvedBase,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === 'get') {
    config.params = { ...(config.params || {}), _t: Date.now() };
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers.Pragma = 'no-cache';
    config.headers.Expires = '0';
  }
  return config;
});

const API_ORIGIN = resolvedBase.replace(/\/api\/v\d+\/?$/, '');

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
    drink: MenuCategory.BEVERAGE,
    drinks: MenuCategory.BEVERAGE,
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

const resolveImageUrl = (rawUrl?: string, version?: string): string => {
  if (!rawUrl) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
  }

  const url = rawUrl.trim();
  if (!url) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
  }

  const appendVersion = (value: string) => {
    if (!version) return value;
    const separator = value.includes('?') ? '&' : '?';
    return `${value}${separator}v=${encodeURIComponent(version)}`;
  };

  if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
    return appendVersion(url);
  }

  if (url.startsWith('/images/')) {
    return appendVersion(`${API_ORIGIN}${url}`);
  }

  if (url.startsWith('menu/')) {
    return appendVersion(`${API_ORIGIN}/images/${url}`);
  }

  return appendVersion(`${API_ORIGIN}/images/menu/${url.replace(/^\/+/, '')}`);
};

const normalizeVndPrice = (value: unknown): number => {
  return Number(value) || 0;
};

export class MenuRepository {
  async getAllMenuItems(): Promise<MenuItem[]> {
    try {
      console.log('🌐 Fetch menu từ API');
      const response = await apiClient.get('/foods', {
        params: { is_available: true }
      });
      const menuItems = response.data.data.map(this.mapToMenuItem);
      return menuItems;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }

  async clearCache(): Promise<void> {
    console.log('Menu cache is disabled for live customer updates');
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
        params: { category: categoryToApiValue(category), is_available: true }
      });
      return response.data.data.map(this.mapToMenuItem);
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      return [];
    }
  }

  async refreshMenuItems(): Promise<MenuItem[]> {
    console.log('🔄 Force refresh menu từ API');
    await this.clearCache();
    return this.getAllMenuItems();
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
    // Chấp nhận cả URL cloud và path tương đối từ backend scripts cũ
    let imageSource: any;
    const primaryImage = data.images?.find((img: any) => img.is_primary) || data.images?.[0];
    const imageUrl = resolveImageUrl(primaryImage?.image_url, data.updated_at || primaryImage?.updated_at);
    
    if (imageUrl) {
      imageSource = { uri: imageUrl };
    } else {
      // Fallback về ảnh mặc định
      imageSource = { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800' };
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: normalizeVndPrice(data.base_price),
      category: normalizeCategoryToVi(data.category),
      available: data.is_available,
      image: imageSource,
      // Đồ uống không hiển thị badge "Chay" để tránh gây hiểu nhầm
      badge: normalizeCategoryToVi(data.category) === MenuCategory.BEVERAGE
        ? undefined
        : data.is_spicy
        ? 'Cay'
        : data.is_vegetarian
        ? 'Chay'
        : undefined,
      badgeColor: normalizeCategoryToVi(data.category) === MenuCategory.BEVERAGE
        ? undefined
        : data.is_spicy
        ? '#FF6B6B'
        : data.is_vegetarian
        ? '#51CF66'
        : undefined,
    };
  }
}
