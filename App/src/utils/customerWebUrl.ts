import { CUSTOMER_WEB_BASE_URL } from '@env';
import { appendNgrokBypassQuery } from './publicWebUrl';

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
  tableId?: string | null
): string {
  const num = encodeURIComponent(String(tableNumber).trim());
  const id = tableId?.trim();
  const path = id
    ? `${baseUrl()}/table/${num}?tid=${encodeURIComponent(id)}`
    : `${baseUrl()}/table/${num}`;
  return appendNgrokBypassQuery(path);
}
