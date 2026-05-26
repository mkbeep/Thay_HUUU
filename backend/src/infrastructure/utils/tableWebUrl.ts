import { config } from '../config/env.config';

export interface TableWebLinkParams {
  /** ID bàn (Firebase); thêm vào query để web có thể đối chiếu, có thể bỏ qua nếu chỉ có số bàn. */
  tableId?: string;
  tableNumber: string;
  /** Token QR hiện hành. Khi token đổi, link QR cũ sẽ không tạo được phiên mới. */
  qrToken?: string;
}

/**
 * URL công khai tới bản web khách (Expo Web trong App — thư mục `web-app` khi build).
 * Khách quét QR bằng camera điện thoại mở trình duyệt; không dùng deep link Expo Go.
 */
export function buildTableWebUrl(params: TableWebLinkParams): string {
  const base = config.customerWeb.baseUrl;
  const num = encodeURIComponent(String(params.tableNumber).trim());
  const id = params.tableId?.trim();
  const query = new URLSearchParams();
  if (id) query.set('tid', id);
  if (params.qrToken?.trim()) query.set('qrt', params.qrToken.trim());
  const qs = query.toString();
  return `${base}/table/${num}${qs ? `?${qs}` : ''}`;
}
