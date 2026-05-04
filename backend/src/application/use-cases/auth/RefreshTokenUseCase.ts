/**
 * Refresh Token Use Case - Application Layer
 * Xử lý logic làm mới access token
 */

import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { JwtService } from '../../services/JwtService';
import { AppError } from '../../errors/AppError';

export interface RefreshTokenDTO {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export class RefreshTokenUseCase {
  constructor(
    private userRepository: IUserRepository,
    private jwtService: JwtService
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<RefreshTokenResponse> {
    // 1. Verify refresh token
    const payload = this.jwtService.verifyRefreshToken(dto.refresh_token);
    if (!payload) {
      throw new AppError('Refresh token không hợp lệ', 401);
    }

    // 2. Check if user still exists and is active
    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.is_active) {
      throw new AppError('Người dùng không tồn tại hoặc đã bị vô hiệu hóa', 401);
    }

    // 3. Get user roles
    const userWithRoles = await this.userRepository.findByIdWithRoles(user.id);
    const roles = userWithRoles?.roles.map(r => r.role_name) || [];

    // 4. Generate new tokens
    const newPayload = {
      userId: user.id,
      email: user.email,
      roles,
    };

    const access_token = this.jwtService.generateAccessToken(newPayload);
    const refresh_token = this.jwtService.generateRefreshToken(newPayload);

    return {
      access_token,
      refresh_token,
    };
  }
}
