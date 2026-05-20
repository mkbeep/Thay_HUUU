import { config } from '../config/env.config';
import { appendNgrokBypassQuery } from './publicWebUrl';

export interface TableWebLinkParams {
  /** ID bàn (Firebase); thêm vào query để web có thể đối chiếu, có thể bỏ qua nếu chỉ có số bàn. */
  tableId?: string;
  tableNumber: string;
}

/**
 * URL công khai tới bản web khách (Expo Web trong App — thư mục `web-app` khi build).
 * Khách quét QR bằng camera điện thoại mở trình duyệt; không dùng deep link Expo Go.
 */
export function buildTableWebUrl(params: TableWebLinkParams): string {
  const base = config.customerWeb.baseUrl;
  const num = encodeURIComponent(String(params.tableNumber).trim());
  const id = params.tableId?.trim();
  const path = id
    ? `${base}/table/${num}?tid=${encodeURIComponent(id)}`
    : `${base}/table/${num}`;
  return appendNgrokBypassQuery(path);
}
