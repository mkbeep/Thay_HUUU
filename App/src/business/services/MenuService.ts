import { MenuItem, MenuCategory } from '../../domain/models/MenuItem';
import { MenuRepository } from '../../data/repositories/MenuRepository';

export class MenuService {
  private menuRepository: MenuRepository;

  constructor() {
    this.menuRepository = new MenuRepository();
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return await this.menuRepository.getAllMenuItems();
  }

  async getMenuItemsByCategory(category: MenuCategory): Promise<MenuItem[]> {
    return await this.menuRepository.getMenuItemsByCategory(category);
  }

  async toggleItemAvailability(itemId: string): Promise<MenuItem | undefined> {
    const item = await this.menuRepository.getMenuItemById(itemId);
    if (item) {
      return await this.menuRepository.updateMenuItem(itemId, {
        available: !item.available,
      });
    }
    return undefined;
  }

  async searchMenuItems(query: string): Promise<MenuItem[]> {
    const allItems = await this.menuRepository.getAllMenuItems();
    const lowerQuery = query.toLowerCase();
    return allItems.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    );
  }
}
