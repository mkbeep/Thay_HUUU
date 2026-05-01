export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  available: boolean;
  image?: any; // Cho React Native Image source
  badge?: string;
  badgeColor?: string;
}

export enum MenuCategory {
  APPETIZER = 'Khai vị',
  MAIN_COURSE = 'Món chính',
  DESSERT = 'Tráng miệng',
  BEVERAGE = 'Đồ uống',
  SPECIAL = 'Đặc biệt',
}
