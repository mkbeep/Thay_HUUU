/**
 * Image Constants
 * Domain Layer - Định nghĩa các hằng số cho images
 */

export const IMAGES = {
  // Logo
  logo: null, // Chưa có logo
  
  // Menu Items - Sử dụng ảnh local từ folder menu
  menu: {
    item1: require('../../../assets/images/menu/1.png'),
    item2: require('../../../assets/images/menu/2.png'),
    item3: require('../../../assets/images/menu/3.png'),
    item4: require('../../../assets/images/menu/4.png'),
  },
  
  // Hero/Banner - Fallback về URL vì chưa có ảnh local
  hero: {
    welcomeBanner: null,
    menuBanner: null,
  },
} as const;

export type ImageKeys = typeof IMAGES;
