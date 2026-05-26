/**
 * Table Entity - Domain Layer
 */

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLEANING = 'cleaning',
  OUT_OF_SERVICE = 'out_of_service'
}

export interface DiningTable {
  id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  qr_code?: string;
  location?: string;
  created_at: Date;
  updated_at: Date;
}

/** Dòng giỏ hàng lưu trên server theo session (không lưu trên trình duyệt) */
export interface SessionCartLine {
  food_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  price_display?: string;
  note?: string;
  options?: string;
}

export interface TableSession {
  id: string;
  table_id: string;
  session_code: string;
  customer_count: number;
  started_at: Date;
  ended_at?: Date;
  is_active: boolean;
  created_by?: string;
  /** Token thiết bị — lưu localStorage/AsyncStorage, gửi kèm mọi request session */
  session_token?: string;
  /** Dấu vân tay thiết bị — phân biệt khách quét QR */
  device_fingerprint?: string;
  /** Lần ping gần nhất từ app foreground */
  last_heartbeat?: Date;
  /** @deprecated dùng last_heartbeat */
  last_ping_at?: Date;
  /** @deprecated giỏ lưu collection carts */
  cart?: SessionCartLine[];
  /** Thời điểm tự đóng session (sau khi mọi món đã paid) */
  auto_close_at?: Date | null;
  /** Đã gửi session:closing_soon (2 phút trước khi đóng) */
  closing_soon_sent_at?: Date | null;
}

export interface TableSessionStats {
  minutes_used: number;
  unpaid_total: number;
  pending_kitchen_items: number;
}

export type TableSessionWithStats = TableSession & {
  session_stats?: TableSessionStats;
};

export type TableWithSession = DiningTable & {
  current_session?: TableSession;
};
