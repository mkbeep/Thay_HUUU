import axios from 'axios';
import type {
  CreateStaffPayload,
  Role,
  StaffMember,
  UpdateStaffRolePayload,
} from '../types/staff.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'Đã xảy ra lỗi'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Đã xảy ra lỗi';
}

export const staffApi = {
  async getActiveCount(): Promise<number> {
    const response = await axios.get(`${API_URL}/staff/stats/active-count`, {
      headers: getAuthHeaders(),
    });
    return response.data.data.count as number;
  },

  async getDirectory(): Promise<StaffMember[]> {
    const response = await axios.get(`${API_URL}/staff`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as StaffMember[];
  },

  async getRoles(): Promise<Role[]> {
    const response = await axios.get(`${API_URL}/staff/roles`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as Role[];
  },

  async createStaff(payload: CreateStaffPayload): Promise<StaffMember> {
    try {
      const response = await axios.post(`${API_URL}/staff`, payload, {
        headers: getAuthHeaders(),
      });
      return response.data.data as StaffMember;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async updateStaffRole(
    userId: string,
    payload: UpdateStaffRolePayload
  ): Promise<void> {
    try {
      await axios.patch(`${API_URL}/staff/${userId}/role`, payload, {
        headers: getAuthHeaders(),
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
