export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  available: boolean;
  preparationTime?: number; // phút
  ingredients?: string[];
  allergens?: string[];
  isVegetarian?: boolean;
  isSpicy?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum MenuCategory {
  APPETIZER = 'Khai vị',
  MAIN_COURSE = 'Món chính',
  DESSERT = 'Tráng miệng',
  BEVERAGE = 'Đồ uống',
  SPECIAL = 'Đặc biệt',
}

export interface CreateMenuItemDto {
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  preparationTime?: number;
  ingredients?: string[];
  allergens?: string[];
  isVegetarian?: boolean;
  isSpicy?: boolean;
}

export interface UpdateMenuItemDto extends Partial<CreateMenuItemDto> {
  available?: boolean;
}
