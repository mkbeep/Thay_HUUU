import { MenuItem, MenuCategory } from '../../domain/models/MenuItem';
import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Đọc API_URL từ .env, fallback về localhost nếu không có
const API_BASE_URL = API_URL || 'http://192.168.1.3:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');

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

const resolveImageUrl = (rawUrl?: string): string => {
  if (!rawUrl) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
  }

  const url = rawUrl.trim();
  if (!url) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
  }

  if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
    return url;
  }

  if (url.startsWith('/images/')) {
    return `${API_ORIGIN}${url}`;
  }

  if (url.startsWith('menu/')) {
    return `${API_ORIGIN}/images/${url}`;
  }

  return `${API_ORIGIN}/images/menu/${url.replace(/^\/+/, '')}`;
};

const CACHE_KEY = '@menu_items_cache';
const CACHE_TIMESTAMP_KEY = '@menu_items_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export class MenuRepository {
  async getAllMenuItems(): Promise<MenuItem[]> {
    try {
      // Kiểm tra cache trước
      const cachedData = await this.getCachedMenuItems();
      if (cachedData) {
        console.log('✅ Load menu từ cache');
        return cachedData;
      }

      // Nếu không có cache, fetch từ API
      console.log('🌐 Fetch menu từ API');
      const response = await apiClient.get('/foods', {
        params: { is_available: true }
      });
      const menuItems = response.data.data.map(this.mapToMenuItem);
      
      // Lưu vào cache
      await this.cacheMenuItems(menuItems);
      
      return menuItems;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      
      // Nếu lỗi, thử load từ cache cũ (dù đã hết hạn)
      const oldCache = await AsyncStorage.getItem(CACHE_KEY);
      if (oldCache) {
        console.log('⚠️ Load menu từ cache cũ do lỗi API');
        return JSON.parse(oldCache);
      }
      
      return [];
    }
  }

  private async getCachedMenuItems(): Promise<MenuItem[] | null> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      const cachedTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (!cachedData || !cachedTimestamp) {
        return null;
      }

      const timestamp = parseInt(cachedTimestamp, 10);
      const now = Date.now();
      
      // Kiểm tra cache còn hạn không
      if (now - timestamp < CACHE_DURATION) {
        return JSON.parse(cachedData);
      }
      
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  private async cacheMenuItems(items: MenuItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error caching menu items:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log('🗑️ Cache đã được xóa');
    } catch (error) {
      console.error('Error clearing cache:', error);
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
    const imageUrl = resolveImageUrl(data.images?.[0]?.image_url);
    
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
      price: data.base_price,
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
