/**
 * Auth Controller - Presentation Layer
 * Xử lý HTTP requests liên quan đến authentication
 */

import { Request, Response, NextFunction } from 'express';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import { RegisterUseCase } from '../../application/use-cases/auth/RegisterUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase';
import { UserRepository } from '../../infrastructure/database/repositories/UserRepository';
import { JwtService } from '../../application/services/JwtService';

export class AuthController {
  private loginUseCase: LoginUseCase;
  private registerUseCase: RegisterUseCase;
  private refreshTokenUseCase: RefreshTokenUseCase;

  constructor() {
    const userRepository = new UserRepository();
    const jwtService = new JwtService();

    this.loginUseCase = new LoginUseCase(userRepository, jwtService);
    this.registerUseCase = new RegisterUseCase(userRepository);
    this.refreshTokenUseCase = new RefreshTokenUseCase(userRepository, jwtService);
  }

  /**
   * POST /api/v1/auth/login
   * Đăng nhập
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.loginUseCase.execute(req.body);

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/register
   * Đăng ký tài khoản mới
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.registerUseCase.execute(req.body);

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/refresh
   * Làm mới access token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.refreshTokenUseCase.execute(req.body);

      res.status(200).json({
        success: true,
        message: 'Token đã được làm mới',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/logout
   * Đăng xuất (clear FCM token)
   */
  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Implement logout logic (clear FCM token)
      
      res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/auth/me
   * Lấy thông tin user hiện tại
   */
  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRepository = new UserRepository();
      const user = await userRepository.findByIdWithRoles(req.user!.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Người dùng không tồn tại',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone_number: user.phone_number,
          avatar_url: user.avatar_url,
          roles: user.roles.map(r => r.role_name),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
