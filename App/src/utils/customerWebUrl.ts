import { CUSTOMER_WEB_BASE_URL } from '@env';

function baseUrl(): string {
  const raw = (CUSTOMER_WEB_BASE_URL || 'http://localhost:8081').trim();
  return raw.replace(/\/+$/, '');
}

/** Trang chủ bản web (Expo Web / `web-app`) — trùng CUSTOMER_WEB_BASE_URL khi in QR. */
export function getCustomerWebRootUrl(): string {
  return `${baseUrl()}/`;
}

/**
 * Cùng quy ước với backend `buildTableWebUrl` — để app mở đúng trang web bàn.
 */
export function buildCustomerTableWebUrl(
  tableNumber: string | number,
  tableId?: string | null,
  qrToken?: string | null
): string {
  const num = encodeURIComponent(String(tableNumber).trim());
  const query = new URLSearchParams();
  const id = tableId?.trim();
  if (id) query.set('tid', id);
  if (qrToken?.trim()) query.set('qrt', qrToken.trim());
  const qs = query.toString();
  return `${baseUrl()}/table/${num}${qs ? `?${qs}` : ''}`;
}
