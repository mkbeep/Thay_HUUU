import axios from 'axios';
import type { ReportsAnalytics, ReportsQueryParams } from '../types/report.types';

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

export const reportsApi = {
  async getAnalytics(params: ReportsQueryParams): Promise<ReportsAnalytics> {
    try {
      const response = await axios.get(`${API_URL}/reports/analytics`, {
        headers: getAuthHeaders(),
        params: {
          period: params.period,
          ...(params.period === 'custom' && params.from && params.to
            ? { from: params.from, to: params.to }
            : {}),
        },
      });
      return response.data.data as ReportsAnalytics;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
