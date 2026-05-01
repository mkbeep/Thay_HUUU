import { MenuItem, MenuCategory } from '../../domain/models/MenuItem';
import { MOCK_MENU_ITEMS } from '../mockData/menuItems';

export class MenuRepository {
  async getAllMenuItems(): Promise<MenuItem[]> {
    // Chuyển đổi từ MenuItemData sang MenuItem
    const items: MenuItem[] = MOCK_MENU_ITEMS.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: parseFloat(item.price.replace('k', '')) * 1000, // Chuyển "145k" thành 145000
      category: this.mapCategory(item.category),
      available: item.available,
      image: item.image,
      badge: item.badge,
      badgeColor: item.badgeColor,
    }));
    
    return Promise.resolve(items);
  }

  async getMenuItemById(id: string): Promise<MenuItem | undefined> {
    const items = await this.getAllMenuItems();
    return Promise.resolve(items.find(item => item.id === id));
  }

  async getMenuItemsByCategory(category: MenuCategory): Promise<MenuItem[]> {
    const items = await this.getAllMenuItems();
    return Promise.resolve(items.filter(item => item.category === category));
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | undefined> {
    const items = await this.getAllMenuItems();
    const item = items.find(i => i.id === id);
    if (item) {
      return Promise.resolve({ ...item, ...updates });
    }
    return Promise.resolve(undefined);
  }

  // Helper method để map category string sang enum
  private mapCategory(category: string): MenuCategory {
    const categoryMap: { [key: string]: MenuCategory } = {
      'starters': MenuCategory.APPETIZER,
      'main': MenuCategory.MAIN_COURSE,
      'desserts': MenuCategory.DESSERT,
      'drinks': MenuCategory.BEVERAGE,
      'specials': MenuCategory.SPECIAL,
    };
    return categoryMap[category] || MenuCategory.MAIN_COURSE;
  }
}
