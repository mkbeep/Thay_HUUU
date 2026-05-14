/**
 * Một số món seed trỏ public_id Cloudinary chưa upload hoặc sai thư mục (.jpg vs .png đã upload).
 * Ánh xạ sang URL đã tồn tại trên account (đồng bộ backend/scripts/menu-image-urls.flat.json).
 */
const REMOTE_PLACEHOLDER =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';

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

export function fixCloudinaryMenuFoodImageUrl(url: string): string {
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
}

export function resolveMenuImageUrl(rawUrl: string | undefined, apiOrigin: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return REMOTE_PLACEHOLDER;
  }
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
    return fixCloudinaryMenuFoodImageUrl(trimmed);
  }
  const origin = apiOrigin.replace(/\/+$/, '');
  let built: string;
  if (trimmed.startsWith('/images/')) {
    built = `${origin}${trimmed}`;
  } else if (trimmed.startsWith('menu/')) {
    built = `${origin}/images/${trimmed}`;
  } else {
    built = `${origin}/images/menu/${trimmed.replace(/^\/+/, '')}`;
  }
  return fixCloudinaryMenuFoodImageUrl(built);
}
