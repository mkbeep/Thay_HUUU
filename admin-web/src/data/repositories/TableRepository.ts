import { Table, TableStatus, CreateTableDto, UpdateTableDto } from '../../domain/models/Table';

// Mock data
const MOCK_TABLES: Table[] = [
  { id: '1', number: 1, capacity: 4, status: TableStatus.AVAILABLE, location: 'Tầng 1' },
  { id: '2', number: 2, capacity: 2, status: TableStatus.OCCUPIED, location: 'Tầng 1', currentOrderId: '1' },
  { id: '3', number: 3, capacity: 6, status: TableStatus.RESERVED, location: 'Tầng 1' },
  { id: '4', number: 4, capacity: 4, status: TableStatus.AVAILABLE, location: 'Tầng 2' },
  { id: '5', number: 5, capacity: 8, status: TableStatus.OCCUPIED, location: 'Tầng 2' },
];

export class TableRepository {
  private tables: Table[] = [...MOCK_TABLES];

  async getAllTables(): Promise<Table[]> {
    await this.delay(300);
    return Promise.resolve([...this.tables]);
  }

  async getTableById(id: string): Promise<Table | undefined> {
    await this.delay(200);
    return Promise.resolve(this.tables.find(table => table.id === id));
  }

  async getTableByNumber(number: number): Promise<Table | undefined> {
    await this.delay(200);
    return Promise.resolve(this.tables.find(table => table.number === number));
  }

  async getTablesByStatus(status: TableStatus): Promise<Table[]> {
    await this.delay(300);
    return Promise.resolve(this.tables.filter(table => table.status === status));
  }

  async createTable(dto: CreateTableDto): Promise<Table> {
    await this.delay(500);
    const newTable: Table = {
      id: Date.now().toString(),
      ...dto,
      status: TableStatus.AVAILABLE,
    };
    this.tables.push(newTable);
    return Promise.resolve(newTable);
  }

  async updateTable(id: string, dto: UpdateTableDto): Promise<Table | undefined> {
    await this.delay(500);
    const index = this.tables.findIndex(table => table.id === id);
    if (index !== -1) {
      this.tables[index] = {
        ...this.tables[index],
        ...dto,
      };
      return Promise.resolve(this.tables[index]);
    }
    return Promise.resolve(undefined);
  }

  async deleteTable(id: string): Promise<boolean> {
    await this.delay(500);
    const index = this.tables.findIndex(table => table.id === id);
    if (index !== -1) {
      this.tables.splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
