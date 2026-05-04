/**
 * Register Use Case - Application Layer
 * Xử lý logic đăng ký người dùng mới
 */

import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { AppError } from '../../errors/AppError';
import { User } from '../../../domain/entities/User';

export interface RegisterDTO {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

export class RegisterUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: RegisterDTO): Promise<User> {
    // 1. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email)) {
      throw new AppError('Email không hợp lệ', 400);
    }

    // 2. Validate password strength
    if (dto.password.length < 6) {
      throw new AppError('Mật khẩu phải có ít nhất 6 ký tự', 400);
    }

    // 3. Check if email already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new AppError('Email đã được sử dụng', 409);
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 5. Create user
    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      full_name: dto.full_name,
      phone_number: dto.phone_number,
      is_active: true,
      email_verified: false,
    });

    // 6. Assign default role (customer)
    // TODO: Implement role assignment logic

    return user;
  }
}
