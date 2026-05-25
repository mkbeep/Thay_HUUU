/**
 * Staff Use Cases - Application Layer
 */

import { AppError } from '../../errors/AppError';
import {
  CreateStaffDTO,
  RoleDTO,
  StaffMemberDTO,
} from '../../dto/StaffDTO';
import { StaffRepository } from '../../../infrastructure/database/repositories/StaffRepository';

export class GetActiveStaffCountUseCase {
  constructor(private staffRepository: StaffRepository) {}

  async execute(): Promise<number> {
    return this.staffRepository.countActiveUsers();
  }
}

export class GetStaffDirectoryUseCase {
  constructor(private staffRepository: StaffRepository) {}

  async execute(): Promise<StaffMemberDTO[]> {
    return this.staffRepository.getStaffDirectory();
  }
}

export class GetRolesUseCase {
  constructor(private staffRepository: StaffRepository) {}

  async execute(): Promise<RoleDTO[]> {
    return this.staffRepository.findAllRoles();
  }
}

export class CreateStaffUseCase {
  constructor(private staffRepository: StaffRepository) {}

  async execute(dto: CreateStaffDTO, assignedBy: string): Promise<StaffMemberDTO> {
    if (!dto.full_name?.trim()) {
      throw new AppError('Họ và tên là bắt buộc', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email?.trim() || '')) {
      throw new AppError('Email không hợp lệ', 400);
    }

    if (!dto.password || dto.password.length < 6) {
      throw new AppError('Mật khẩu phải có ít nhất 6 ký tự', 400);
    }

    if (!dto.role_id) {
      throw new AppError('Vai trò là bắt buộc', 400);
    }

    try {
      return await this.staffRepository.createStaff(dto, assignedBy);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      const firebaseCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: string }).code)
          : '';

      if (
        message === 'EMAIL_EXISTS' ||
        firebaseCode === 'auth/email-already-exists'
      ) {
        throw new AppError('Email đã được sử dụng', 409);
      }
      if (message === 'ROLE_NOT_FOUND') {
        throw new AppError('Vai trò không tồn tại', 404);
      }
      if (message === 'ROLE_NOT_STAFF') {
        throw new AppError('Vai trò CUSTOMER không dùng cho nhân viên', 400);
      }
      if (firebaseCode === 'auth/invalid-password') {
        throw new AppError('Mật khẩu không hợp lệ', 400);
      }
      if (
        message.includes('no configuration corresponding') ||
        firebaseCode === 'auth/configuration-not-found'
      ) {
        throw new AppError(
          'Firebase Authentication chưa được bật. Tắt USE_FIREBASE_AUTH hoặc bật Email/Password trên Firebase Console.',
          503
        );
      }

      throw error;
    }
  }
}

export class UpdateStaffRoleUseCase {
  constructor(private staffRepository: StaffRepository) {}

  async execute(
    userId: string,
    roleId: string,
    assignedBy: string
  ): Promise<void> {
    if (!userId) {
      throw new AppError('User ID không hợp lệ', 400);
    }
    if (!roleId) {
      throw new AppError('Vai trò là bắt buộc', 400);
    }

    try {
      await this.staffRepository.updateUserRole(userId, roleId, assignedBy);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'ROLE_NOT_FOUND') {
        throw new AppError('Vai trò không tồn tại', 404);
      }
      if (message === 'ROLE_NOT_STAFF') {
        throw new AppError('Vai trò CUSTOMER không dùng cho nhân viên', 400);
      }
      if (message === 'USER_NOT_FOUND') {
        throw new AppError('Nhân viên không tồn tại', 404);
      }
      throw error;
    }
  }
}
