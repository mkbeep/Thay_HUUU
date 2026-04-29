import { MenuItem, MenuCategory } from '../../domain/models/MenuItem';

export class MenuRepository {
  private menuItems: MenuItem[] = [
    {
      id: '1',
      name: 'Gỏi cuốn',
      description: 'Gỏi cuốn tôm thịt tươi ngon',
      price: 35000,
      category: MenuCategory.APPETIZER,
      available: true,
    },
    {
      id: '2',
      name: 'Phở bò',
      description: 'Phở bò truyền thống Hà Nội',
      price: 65000,
      category: MenuCategory.MAIN_COURSE,
      available: true,
    },
    {
      id: '3',
      name: 'Bún chả',
      description: 'Bún chả Hà Nội đặc sản',
      price: 55000,
      category: MenuCategory.MAIN_COURSE,
      available: true,
    },
    {
      id: '4',
      name: 'Chè ba màu',
      description: 'Chè ba màu mát lạnh',
      price: 25000,
      category: MenuCategory.DESSERT,
      available: true,
    },
    {
      id: '5',
      name: 'Trà đá',
      description: 'Trà đá truyền thống',
      price: 10000,
      category: MenuCategory.BEVERAGE,
      available: true,
    },
    {
      id: '6',
      name: 'Cà phê sữa đá',
      description: 'Cà phê phin truyền thống',
      price: 30000,
      category: MenuCategory.BEVERAGE,
      available: true,
    },
  ];

  async getAllMenuItems(): Promise<MenuItem[]> {
    return Promise.resolve([...this.menuItems]);
  }

  async getMenuItemById(id: string): Promise<MenuItem | undefined> {
    return Promise.resolve(this.menuItems.find(item => item.id === id));
  }

  async getMenuItemsByCategory(category: MenuCategory): Promise<MenuItem[]> {
    return Promise.resolve(this.menuItems.filter(item => item.category === category));
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | undefined> {
    const index = this.menuItems.findIndex(item => item.id === id);
    if (index !== -1) {
      this.menuItems[index] = { ...this.menuItems[index], ...updates };
      return Promise.resolve(this.menuItems[index]);
    }
    return Promise.resolve(undefined);
  }
}
