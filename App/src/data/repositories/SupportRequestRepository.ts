import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

export interface CreateSupportRequestDTO {
  table_id: string;
  table_number: string;
  table_session_id?: string;
  type: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  note?: string;
}

export class SupportRequestRepository {
  async createSupportRequest(dto: CreateSupportRequestDTO): Promise<any> {
    try {
      const response = await apiClient.post('/support-requests', dto);
      return response.data.data;
    } catch (error) {
      console.error('Error creating support request:', error);
      throw error;
    }
  }

  async getSupportRequestsByTable(tableId: string): Promise<any[]> {
    try {
      const response = await apiClient.get('/support-requests', {
        params: { table_id: tableId },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching support requests:', error);
      return [];
    }
  }
}
