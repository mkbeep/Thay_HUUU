/**
 * User Entity - Domain Layer
 * Đại diện cho thực thể người dùng trong hệ thống
 */

export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  fcm_token?: string; // For push notifications
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: Date;
  assigned_by: string;
}

export interface Role {
  id: string;
  role_name: string;
  description?: string;
  permissions: string[];
  created_at: Date;
  updated_at: Date;
}

export type UserWithRoles = User & {
  roles: Role[];
};
