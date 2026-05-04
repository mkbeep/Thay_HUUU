export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  position: string;
  avatar?: string;
  salary?: number;
  joinedDate: Date;
  status: StaffStatus;
  address?: string;
  emergencyContact?: string;
}

export enum StaffRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CHEF = 'chef',
  WAITER = 'waiter',
  CASHIER = 'cashier',
}

export enum StaffStatus {
  ACTIVE = 'Đang làm việc',
  ON_LEAVE = 'Nghỉ phép',
  INACTIVE = 'Đã nghỉ việc',
}

export interface CreateStaffDto {
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  position: string;
  salary?: number;
  address?: string;
  emergencyContact?: string;
}

export interface UpdateStaffDto extends Partial<CreateStaffDto> {
  status?: StaffStatus;
  avatar?: string;
}
