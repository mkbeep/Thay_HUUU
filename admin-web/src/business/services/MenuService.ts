import { MenuItem, MenuCategory, CreateMenuItemDto, UpdateMenuItemDto } from '../../domain/models/MenuItem';
import { MenuRepository } from '../../data/repositories/MenuRepository';

export class MenuService {
  private menuRepository: MenuRepository;

  constructor() {
    this.menuRepository = new MenuRepository();
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return await this.menuRepository.getAllMenuItems();
  }

  async getMenuItemById(id: string): Promise<MenuItem | undefined> {
    return await this.menuRepository.getMenuItemById(id);
  }

  async getMenuItemsByCategory(category: MenuCategory): Promise<MenuItem[]> {
    return await this.menuRepository.getMenuItemsByCategory(category);
  }

  async createMenuItem(dto: CreateMenuItemDto): Promise<MenuItem> {
    // Validate input
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Tên món ăn không được để trống');
    }
    if (dto.price < 0) {
      throw new Error('Giá không được âm');
    }

    return await this.menuRepository.createMenuItem(dto);
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto): Promise<MenuItem | undefined> {
    // Validate input
    if (dto.price !== undefined && dto.price < 0) {
      throw new Error('Giá không được âm');
    }

    return await this.menuRepository.updateMenuItem(id, dto);
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    return await this.menuRepository.deleteMenuItem(id);
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
    if (!query || query.trim().length === 0) {
      return await this.menuRepository.getAllMenuItems();
    }
    return await this.menuRepository.searchMenuItems(query);
  }

  async getAvailableItems(): Promise<MenuItem[]> {
    const allItems = await this.menuRepository.getAllMenuItems();
    return allItems.filter(item => item.available);
  }

  async getUnavailableItems(): Promise<MenuItem[]> {
    const allItems = await this.menuRepository.getAllMenuItems();
    return allItems.filter(item => !item.available);
  }
}
