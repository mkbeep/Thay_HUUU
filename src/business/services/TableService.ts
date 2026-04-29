import { Table, TableStatus } from '../../domain/models/Table';
import { TableRepository } from '../../data/repositories/TableRepository';

export class TableService {
  private tableRepository: TableRepository;

  constructor() {
    this.tableRepository = new TableRepository();
  }

  async getAllTables(): Promise<Table[]> {
    return await this.tableRepository.getAllTables();
  }

  async getAvailableTables(): Promise<Table[]> {
    return await this.tableRepository.getTablesByStatus(TableStatus.AVAILABLE);
  }

  async occupyTable(tableId: string, orderId: string): Promise<Table | undefined> {
    return await this.tableRepository.updateTableStatus(
      tableId,
      TableStatus.OCCUPIED,
      orderId
    );
  }

  async releaseTable(tableId: string): Promise<Table | undefined> {
    return await this.tableRepository.updateTableStatus(
      tableId,
      TableStatus.AVAILABLE
    );
  }

  async reserveTable(tableId: string): Promise<Table | undefined> {
    return await this.tableRepository.updateTableStatus(
      tableId,
      TableStatus.RESERVED
    );
  }

  async getTableStats(): Promise<{
    total: number;
    available: number;
    occupied: number;
    reserved: number;
  }> {
    const tables = await this.tableRepository.getAllTables();
    
    return {
      total: tables.length,
      available: tables.filter(t => t.status === TableStatus.AVAILABLE).length,
      occupied: tables.filter(t => t.status === TableStatus.OCCUPIED).length,
      reserved: tables.filter(t => t.status === TableStatus.RESERVED).length,
    };
  }
}
