/**
 * Login Use Case - Application Layer
 * Xử lý logic đăng nhập người dùng
 */

import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { JwtService } from '../../services/JwtService';
import { AppError } from '../../errors/AppError';

export interface LoginDTO {
  email: string;
  password: string;
  fcm_token?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    roles: string[];
  };
  access_token: string;
  refresh_token: string;
}

export class LoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private jwtService: JwtService
  ) {}

  async execute(dto: LoginDTO): Promise<LoginResponse> {
    // 1. Tìm user theo email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    // 2. Kiểm tra user có active không
    if (!user.is_active) {
      throw new AppError('Tài khoản đã bị vô hiệu hóa', 403);
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    // 4. Lấy roles của user
    const userWithRoles = await this.userRepository.findByIdWithRoles(user.id);
    const roles = userWithRoles?.roles.map(r => r.role_name) || [];

    // 5. Generate JWT tokens
    const payload = {
      userId: user.id,
      email: user.email,
      roles,
    };

    const access_token = this.jwtService.generateAccessToken(payload);
    const refresh_token = this.jwtService.generateRefreshToken(payload);

    // 6. Update FCM token nếu có
    if (dto.fcm_token) {
      await this.userRepository.updateFcmToken(user.id, dto.fcm_token);
    }

    // 7. Update last login
    await this.userRepository.updateLastLogin(user.id);

    // 8. Return response
    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        roles,
      },
      access_token,
      refresh_token,
    };
  }
}
