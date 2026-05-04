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

export interface TableSession {
  id: string;
  table_id: string;
  session_code: string;
  customer_count: number;
  started_at: Date;
  ended_at?: Date;
  is_active: boolean;
  created_by?: string;
}

export type TableWithSession = DiningTable & {
  current_session?: TableSession;
};
