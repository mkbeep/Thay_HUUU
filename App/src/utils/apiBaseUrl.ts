import { Platform } from 'react-native';
import { API_URL } from '@env';

/**
 * Base URL API cho axios.
 * Trên web: nếu .env dùng localhost/127.0.0.1 nhưng trang mở bằng IP LAN (vd. 192.168.1.2:8081),
 * request tới localhost:3000 sẽ trỏ vào thiết bị khách → không tải được bàn sau khi quét QR.
 * Đổi hostname API theo hostname của trang (giữ port và path từ API_URL).
 */
export function getApiBaseUrl(): string {
  const raw = (API_URL || '').trim() || 'http://192.168.1.3:3000/api/v1';
  const base = raw.replace(/\/+$/, '');
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return base;
  }
  try {
    const u = new URL(base.startsWith('http') ? base : `http://${base}`);
    const pageHost = window.location.hostname;
    if (
      pageHost &&
      pageHost !== 'localhost' &&
      pageHost !== '127.0.0.1' &&
      (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
    ) {
      u.hostname = pageHost;
      return u.toString().replace(/\/$/, '');
    }
  } catch {
    /* giữ base */
  }
  return base;
}
