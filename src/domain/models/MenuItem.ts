export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  available: boolean;
}

export enum MenuCategory {
  APPETIZER = 'Khai vị',
  MAIN_COURSE = 'Món chính',
  DESSERT = 'Tráng miệng',
  BEVERAGE = 'Đồ uống',
}
