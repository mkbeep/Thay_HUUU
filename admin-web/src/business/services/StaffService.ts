import { Staff, StaffRole, StaffStatus, CreateStaffDto, UpdateStaffDto } from '../../domain/models/Staff';
import { StaffRepository } from '../../data/repositories/StaffRepository';

export class StaffService {
  private staffRepository: StaffRepository;

  constructor() {
    this.staffRepository = new StaffRepository();
  }

  async getStaff(): Promise<Staff[]> {
    return await this.staffRepository.getAllStaff();
  }

  async getStaffById(id: string): Promise<Staff | undefined> {
    return await this.staffRepository.getStaffById(id);
  }

  async getStaffByRole(role: StaffRole): Promise<Staff[]> {
    return await this.staffRepository.getStaffByRole(role);
  }

  async getStaffByStatus(status: StaffStatus): Promise<Staff[]> {
    return await this.staffRepository.getStaffByStatus(status);
  }

  async createStaff(dto: CreateStaffDto): Promise<Staff> {
    // Validate input
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Tên nhân viên không được để trống');
    }
    if (!dto.email || !this.isValidEmail(dto.email)) {
      throw new Error('Email không hợp lệ');
    }
    if (!dto.phone || !this.isValidPhone(dto.phone)) {
      throw new Error('Số điện thoại không hợp lệ');
    }

    return await this.staffRepository.createStaff(dto);
  }

  async updateStaff(id: string, dto: UpdateStaffDto): Promise<Staff | undefined> {
    // Validate input
    if (dto.email && !this.isValidEmail(dto.email)) {
      throw new Error('Email không hợp lệ');
    }
    if (dto.phone && !this.isValidPhone(dto.phone)) {
      throw new Error('Số điện thoại không hợp lệ');
    }

    return await this.staffRepository.updateStaff(id, dto);
  }

  async updateStaffStatus(id: string, status: StaffStatus): Promise<Staff | undefined> {
    return await this.staffRepository.updateStaff(id, { status });
  }

  async deleteStaff(id: string): Promise<boolean> {
    return await this.staffRepository.deleteStaff(id);
  }

  async getActiveStaff(): Promise<Staff[]> {
    return await this.staffRepository.getStaffByStatus(StaffStatus.ACTIVE);
  }

  async getInactiveStaff(): Promise<Staff[]> {
    return await this.staffRepository.getStaffByStatus(StaffStatus.INACTIVE);
  }

  async searchStaff(query: string): Promise<Staff[]> {
    const allStaff = await this.staffRepository.getAllStaff();
    const lowerQuery = query.toLowerCase();
    return allStaff.filter(staff =>
      staff.name.toLowerCase().includes(lowerQuery) ||
      staff.email.toLowerCase().includes(lowerQuery) ||
      staff.phone.includes(query)
    );
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }
}
