export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
}

export enum TableStatus {
  AVAILABLE = 'Trống',
  OCCUPIED = 'Đang sử dụng',
  RESERVED = 'Đã đặt',
}
