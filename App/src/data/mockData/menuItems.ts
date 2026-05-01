/**
 * Mock Data - Menu Items
 * Data Layer - Dữ liệu mẫu cho menu
 */

import { IMAGES } from '../../domain/constants/images';

export interface MenuItemData {
  id: string;
  name: string;
  price: string;
  image: any;
  badge?: string;
  badgeColor?: string;
  available: boolean;
  category: string;
  description?: string;
}

export const MOCK_MENU_ITEMS: MenuItemData[] = [
  // KHAI VỊ (Starters)
  {
    id: '1',
    name: 'Salad Trái Cây',
    price: '145k',
    image: IMAGES.menu.item1,
    badge: 'Giảm 20%',
    badgeColor: '#AD2C00',
    available: true,
    category: 'starters',
    description: 'Salad trái cây tươi mát với sốt mật ong',
  },
  {
    id: '5',
    name: 'Gỏi Cuốn Tôm Thịt',
    price: '85k',
    image: IMAGES.menu.item1, // Tạm dùng ảnh này
    available: true,
    category: 'starters',
    description: 'Gỏi cuốn tươi ngon với tôm và thịt',
  },
  
  // MÓN CHÍNH (Main Course)
  {
    id: '2',
    name: 'Bạch Tuộc Nướng',
    price: '285k',
    image: IMAGES.menu.item2,
    badge: 'Đặc trưng',
    badgeColor: '#1C1B1B',
    available: true,
    category: 'main',
    description: 'Bạch tuộc nướng sa tế thơm ngon',
  },
  {
    id: '3',
    name: 'Burger Wagyu',
    price: '450k',
    image: IMAGES.menu.item3,
    available: false,
    category: 'main',
    description: 'Burger bò Wagyu cao cấp',
  },
  {
    id: '4',
    name: 'Poke Cá Hồi',
    price: '220k',
    image: IMAGES.menu.item4,
    available: true,
    category: 'main',
    description: 'Poke bowl cá hồi tươi Na Uy',
  },
  {
    id: '6',
    name: 'Phở Bò Đặc Biệt',
    price: '95k',
    image: IMAGES.menu.item2, // Tạm dùng
    available: true,
    category: 'main',
    description: 'Phở bò truyền thống Hà Nội',
  },
  
  // TRÁNG MIỆNG (Desserts)
  {
    id: '7',
    name: 'Tiramisu',
    price: '75k',
    image: IMAGES.menu.item3, // Tạm dùng
    badge: 'Mới',
    badgeColor: '#006A35',
    available: true,
    category: 'desserts',
    description: 'Tiramisu Ý truyền thống',
  },
  {
    id: '8',
    name: 'Chè Ba Màu',
    price: '45k',
    image: IMAGES.menu.item4, // Tạm dùng
    available: true,
    category: 'desserts',
    description: 'Chè ba màu mát lạnh',
  },
  
  // ĐỒ UỐNG (Drinks)
  {
    id: '9',
    name: 'Cà Phê Sữa Đá',
    price: '35k',
    image: IMAGES.menu.item1, // Tạm dùng
    available: true,
    category: 'drinks',
    description: 'Cà phê phin truyền thống',
  },
  {
    id: '10',
    name: 'Trà Sữa Trân Châu',
    price: '55k',
    image: IMAGES.menu.item2, // Tạm dùng
    available: true,
    category: 'drinks',
    description: 'Trà sữa trân châu đường đen',
  },
  
  // ĐẶC BIỆT (Specials)
  {
    id: '11',
    name: 'Set Lẩu Hải Sản',
    price: '680k',
    image: IMAGES.menu.item3, // Tạm dùng
    badge: 'Hot',
    badgeColor: '#EF4444',
    available: true,
    category: 'specials',
    description: 'Set lẩu hải sản cho 4 người',
  },
  {
    id: '12',
    name: 'Combo Gia Đình',
    price: '520k',
    image: IMAGES.menu.item4, // Tạm dùng
    badge: 'Tiết kiệm',
    badgeColor: '#10B981',
    available: true,
    category: 'specials',
    description: 'Combo 5 món cho gia đình',
  },
];
