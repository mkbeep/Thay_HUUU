export interface Table {
  id: string;
  number: string | number; // Support both string (G01, T05) and number (1, 2, 3)
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
}

export enum TableStatus {
  AVAILABLE = 'Trống',
  OCCUPIED = 'Đang sử dụng',
  RESERVED = 'Đã đặt',
}
