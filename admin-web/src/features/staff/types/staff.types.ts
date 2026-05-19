export interface StaffMember {
  id: string;
  uid?: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string | null;
  role_id?: string;
  role_name?: string;
  user_role_id?: string;
}

export interface Role {
  id: string;
  role_name: string;
  description?: string;
  permissions: string[];
}

export interface CreateStaffPayload {
  full_name: string;
  email: string;
  password: string;
  role_id: string;
}

export interface UpdateStaffRolePayload {
  role_id: string;
}
