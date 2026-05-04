import { Staff, StaffRole, StaffStatus, CreateStaffDto, UpdateStaffDto } from '../../domain/models/Staff';

// Mock data
const MOCK_STAFF: Staff[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    email: 'admin@gourmet.com',
    phone: '0901234567',
    role: StaffRole.ADMIN,
    position: 'Quản trị viên hệ thống',
    status: StaffStatus.ACTIVE,
    joinedDate: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Trần Thị B',
    email: 'manager@gourmet.com',
    phone: '0902345678',
    role: StaffRole.MANAGER,
    position: 'Quản lý nhà hàng',
    status: StaffStatus.ACTIVE,
    joinedDate: new Date('2024-02-01'),
  },
];

export class StaffRepository {
  private staff: Staff[] = [...MOCK_STAFF];

  async getAllStaff(): Promise<Staff[]> {
    await this.delay(300);
    return Promise.resolve([...this.staff]);
  }

  async getStaffById(id: string): Promise<Staff | undefined> {
    await this.delay(200);
    return Promise.resolve(this.staff.find(s => s.id === id));
  }

  async getStaffByRole(role: StaffRole): Promise<Staff[]> {
    await this.delay(300);
    return Promise.resolve(this.staff.filter(s => s.role === role));
  }

  async getStaffByStatus(status: StaffStatus): Promise<Staff[]> {
    await this.delay(300);
    return Promise.resolve(this.staff.filter(s => s.status === status));
  }

  async createStaff(dto: CreateStaffDto): Promise<Staff> {
    await this.delay(500);
    const newStaff: Staff = {
      id: Date.now().toString(),
      ...dto,
      status: StaffStatus.ACTIVE,
      joinedDate: new Date(),
    };
    this.staff.push(newStaff);
    return Promise.resolve(newStaff);
  }

  async updateStaff(id: string, dto: UpdateStaffDto): Promise<Staff | undefined> {
    await this.delay(500);
    const index = this.staff.findIndex(s => s.id === id);
    if (index !== -1) {
      this.staff[index] = {
        ...this.staff[index],
        ...dto,
      };
      return Promise.resolve(this.staff[index]);
    }
    return Promise.resolve(undefined);
  }

  async deleteStaff(id: string): Promise<boolean> {
    await this.delay(500);
    const index = this.staff.findIndex(s => s.id === id);
    if (index !== -1) {
      this.staff.splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
