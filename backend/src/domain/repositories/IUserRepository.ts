/**
 * User Repository Interface - Domain Layer
 * Định nghĩa contract cho việc truy xuất dữ liệu User
 */

import { User, UserWithRoles } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByIdWithRoles(id: string): Promise<UserWithRoles | null>;
  findAll(filters?: {
    is_active?: boolean;
    role?: string;
    search?: string;
  }): Promise<User[]>;
  create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  updateFcmToken(userId: string, fcmToken: string): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
}
