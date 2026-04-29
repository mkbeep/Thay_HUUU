import { Table, TableStatus } from '../../domain/models/Table';

export class TableRepository {
  private tables: Table[] = [
    { id: '1', number: 1, capacity: 4, status: TableStatus.AVAILABLE },
    { id: '2', number: 2, capacity: 2, status: TableStatus.OCCUPIED, currentOrderId: '1' },
    { id: '3', number: 3, capacity: 6, status: TableStatus.OCCUPIED, currentOrderId: '2' },
    { id: '4', number: 4, capacity: 4, status: TableStatus.AVAILABLE },
    { id: '5', number: 5, capacity: 8, status: TableStatus.RESERVED },
    { id: '6', number: 6, capacity: 2, status: TableStatus.AVAILABLE },
  ];

  async getAllTables(): Promise<Table[]> {
    return Promise.resolve([...this.tables]);
  }

  async getTableById(id: string): Promise<Table | undefined> {
    return Promise.resolve(this.tables.find(table => table.id === id));
  }

  async getTablesByStatus(status: TableStatus): Promise<Table[]> {
    return Promise.resolve(this.tables.filter(table => table.status === status));
  }

  async updateTableStatus(id: string, status: TableStatus, orderId?: string): Promise<Table | undefined> {
    const index = this.tables.findIndex(table => table.id === id);
    if (index !== -1) {
      this.tables[index].status = status;
      this.tables[index].currentOrderId = orderId;
      return Promise.resolve(this.tables[index]);
    }
    return Promise.resolve(undefined);
  }
}
