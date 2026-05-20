import { Table, TableStatus } from '../../domain/models/Table';
import { apiClient } from '../../utils/apiClient';

export class TableRepository {
  async getAllTables(): Promise<Table[]> {
    try {
      const response = await apiClient.get('/tables');
      return response.data.data.map(this.mapToTable);
    } catch (error) {
      console.error('Error fetching tables:', error);
      return [];
    }
  }

  async getTableById(id: string): Promise<Table | undefined> {
    try {
      const response = await apiClient.get(`/tables/${id}`);
      return this.mapToTable(response.data.data);
    } catch (error) {
      console.error('Error fetching table:', error);
      return undefined;
    }
  }

  async getTableByNumber(tableNumber: string | number): Promise<Table | undefined> {
    try {
      const response = await apiClient.get(
        `/tables/by-number/${encodeURIComponent(String(tableNumber))}`
      );
      return this.mapToTable(response.data.data);
    } catch (error) {
      console.error('Error fetching table by number:', error);
      return undefined;
    }
  }

  async getTablesByStatus(status: TableStatus): Promise<Table[]> {
    try {
      const response = await apiClient.get('/tables', {
        params: { status }
      });
      return response.data.data.map(this.mapToTable);
    } catch (error) {
      console.error('Error fetching tables by status:', error);
      return [];
    }
  }

  async updateTableStatus(id: string, status: TableStatus, orderId?: string): Promise<Table | undefined> {
    try {
      const response = await apiClient.patch(`/tables/${id}/status`, {
        status,
        order_id: orderId,
      });
      return this.mapToTable(response.data.data);
    } catch (error) {
      console.error('Error updating table status:', error);
      return undefined;
    }
  }

  async createTableSession(tableId: string, customerCount: number): Promise<any> {
    try {
      const response = await apiClient.post(`/tables/${tableId}/session`, {
        customer_count: customerCount,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating table session:', error);
      throw error;
    }
  }

  async endTableSession(sessionId: string): Promise<any> {
    try {
      const response = await apiClient.patch(`/tables/session/${sessionId}/end`);
      return response.data.data;
    } catch (error) {
      console.error('Error ending table session:', error);
      throw error;
    }
  }

  private mapToTable = (data: any): Table => {
    // Keep table_number as string or number
    let tableNumber: string | number = 0;
    
    if (data.table_number) {
      // If it's a string like "G01", "T05", keep as string
      // If it's a number or numeric string, convert to number
      if (typeof data.table_number === 'string' && /^\d+$/.test(data.table_number)) {
        tableNumber = parseInt(data.table_number);
      } else {
        tableNumber = data.table_number; // Keep as string (G01, T05, V03)
      }
    }
    
    return {
      id: data.id,
      number: tableNumber,
      capacity: data.capacity,
      status: data.status as TableStatus,
      currentOrderId: data.current_session?.id,
    };
  }
}
