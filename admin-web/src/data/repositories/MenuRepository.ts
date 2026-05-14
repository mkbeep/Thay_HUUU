import { MenuItem, MenuCategory, CreateMenuItemDto, UpdateMenuItemDto } from '../../domain/models/MenuItem';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const API_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, '');

const MENU_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';

// Cloudinary URL fix mapping - some menu items have wrong .jpg URLs, actual files are .png
const BAD_TO_GOOD: [string, string][] = [
  [
    'menu/main-courses/com-chien-duong-chau.jpg',
    'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324610/menu/main-courses/bo-luc-lac.png',
  ],
  [
    'menu/main-courses/pho-bo-ha-noi.jpg',
    'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324623/menu/main-courses/lau-bo-nhat-ban.png',
  ],
  [
    'menu/main-courses/bun-bo-hue.jpg',
    'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324623/menu/main-courses/lau-thai.png',
  ],
  [
    'menu/main-courses/mi-xao-hai-san.jpg',
    'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324628/menu/main-courses/tom-hum-nuong-pho-mai.png',
  ],
  [
    'menu/specials/set-lau-hai-san.jpg',
    'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324623/menu/main-courses/lau-thai.png',
  ],
  [
    'menu/specials/ca-lang-nuong.jpg',
    'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324617/menu/main-courses/ca-kho-to.png',
  ],
  [
    'menu/specials/vit-quay-bac-kinh.jpg',
    'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324630/menu/main-courses/vit-quay-bac-kinh.png',
  ],
  [
    'menu/specials/lau-nam-chay.jpg',
    'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324635/menu/specials/lau-duong-duong.png',
  ],
  [
    'menu/specials/ga-ta-nguyen-con.jpg',
    'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324620/menu/main-courses/ga-nuong-mat-ong.png',
  ],
  [
    'menu/specials/hai-san-nuong-tong-hop.jpg',
    'https://res.cloudinary.com/dqnnwl8h8/image/upload/v1778324633/menu/specials/hai-san-nuong.png',
  ],
];

const fixCloudinaryMenuFoodImageUrl = (url: string): string => {
  const u = (url || '').trim();
  if (!u || !u.includes('res.cloudinary.com')) {
    return u;
  }
  const lower = u.toLowerCase();
  for (const [bad, good] of BAD_TO_GOOD) {
    if (lower.includes(bad.toLowerCase())) {
      return good;
    }
  }
  return u;
};

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

/** Chuẩn hóa category từ API/Firestore (appetizer, main_course, …) sang nhãn UI admin (Khai vị, Món chính, …). */
export const mapFoodApiCategoryToMenuCategory = (category?: string | null): MenuCategory => {
  return normalizeCategoryToVi(category ?? undefined);
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
  
  // Resolve relative/absolute URLs first
  let resolvedUrl: string;
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) {
    resolvedUrl = url;
  } else if (url.startsWith('/images/')) {
    resolvedUrl = `${API_ORIGIN}${url}`;
  } else if (url.startsWith('menu/')) {
    resolvedUrl = `${API_ORIGIN}/images/${url}`;
  } else {
    resolvedUrl = `${API_ORIGIN}/images/menu/${url.replace(/^\/+/, '')}`;
  }
  
  // Apply Cloudinary URL fix after resolution
  return fixCloudinaryMenuFoodImageUrl(resolvedUrl);
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // ✅ Fix: đổi từ 'access_token' thành 'token'
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add cache busting for all requests to prevent stale data
  config.params = { ...(config.params || {}), _t: Date.now() };
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers.Pragma = 'no-cache';
  config.headers.Expires = '0';
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
      const response = await apiClient.get('/foods', { params: { category: categoryToApiValue(category) } });
      return response.data.data.map(this.mapToMenuItem.bind(this));
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      return [];
    }
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    const response = await apiClient.post('/foods', {
      name: dto.name,
      description: dto.description ?? '',
      category: dto.category ? categoryToApiValue(dto.category as MenuCategory) : 'main_course',
      base_price: dto.price,
      is_available: true,
      preparation_time: dto.preparationTime ?? 15,
      is_vegetarian: dto.isVegetarian ?? false,
      is_spicy: dto.isSpicy ?? false,
      ...(dto.imageUrl?.trim() ? { image_url: dto.imageUrl.trim() } : {}),
    });
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
      ].some(value => value !== undefined);

      if (!hasMainPayload) {
        return this.getMenuItemById(id);
      }

      const response = await apiClient.put(`/foods/${id}`, {
        name: dto.name,
        description: dto.description,
        category: dto.category ? categoryToApiValue(dto.category as MenuCategory) : undefined,
        base_price: dto.price,
        preparation_time: dto.preparationTime,
        is_vegetarian: dto.isVegetarian,
        is_spicy: dto.isSpicy,
        ...(dto.imageUrl !== undefined ? { image_url: dto.imageUrl.trim() } : {}),
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
    // Lấy ảnh primary từ images array (hoặc image_url trên document food)
    let imageUrl = '';
    if (data.images && data.images.length > 0) {
      const primaryImage = data.images.find((img: any) => img.is_primary) || data.images[0];
      imageUrl = resolveImageUrl(primaryImage.image_url);
    } else if (typeof data.image_url === 'string' && data.image_url.trim()) {
      imageUrl = resolveImageUrl(data.image_url);
    }
    if (!imageUrl) {
      imageUrl = MENU_IMAGE_FALLBACK;
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
}
