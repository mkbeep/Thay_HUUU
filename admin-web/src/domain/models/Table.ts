export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  location?: string;
  qrCode?: string;
}

export enum TableStatus {
  AVAILABLE = 'Trống',
  OCCUPIED = 'Đang sử dụng',
  RESERVED = 'Đã đặt',
  CLEANING = 'Đang dọn dẹp',
}

export interface CreateTableDto {
  number: number;
  capacity: number;
  location?: string;
}

export interface UpdateTableDto {
  capacity?: number;
  status?: TableStatus;
  location?: string;
  currentOrderId?: string;
}
