import axios from 'axios';
import type {
  AddExportPayload,
  AddImportPayload,
  CreateMaterialPayload,
  Material,
  MaterialHistoryEntry,
  MaterialKpi,
} from '../types/inventory.types';

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

export const inventoryApi = {
  async getStats(): Promise<MaterialKpi> {
    try {
      const response = await axios.get(`${API_URL}/inventory/stats`, {
        headers: getAuthHeaders(),
      });
      return response.data.data as MaterialKpi;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getMaterials(params?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<Material[]> {
    try {
      const response = await axios.get(`${API_URL}/inventory`, {
        headers: getAuthHeaders(),
        params,
      });
      return response.data.data as Material[];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getAlerts(): Promise<Material[]> {
    try {
      const response = await axios.get(`${API_URL}/inventory/alerts`, {
        headers: getAuthHeaders(),
      });
      return response.data.data as Material[];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getHistory(materialId: string): Promise<MaterialHistoryEntry[]> {
    const response = await axios.get(`${API_URL}/inventory/${materialId}/history`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as MaterialHistoryEntry[];
  },

  async createMaterial(payload: CreateMaterialPayload): Promise<Material> {
    try {
      const response = await axios.post(`${API_URL}/inventory`, payload, {
        headers: getAuthHeaders(),
      });
      return response.data.data as Material;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async addImport(materialId: string, payload: AddImportPayload): Promise<Material> {
    try {
      const response = await axios.post(
        `${API_URL}/inventory/${materialId}/import`,
        payload,
        { headers: getAuthHeaders() }
      );
      return response.data.data as Material;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async addExport(materialId: string, payload: AddExportPayload): Promise<Material> {
    try {
      const response = await axios.post(
        `${API_URL}/inventory/${materialId}/export`,
        payload,
        { headers: getAuthHeaders() }
      );
      return response.data.data as Material;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
