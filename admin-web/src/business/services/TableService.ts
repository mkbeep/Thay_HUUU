import { Table, TableStatus, CreateTableDto, UpdateTableDto } from '../../domain/models/Table';
import { TableRepository } from '../../data/repositories/TableRepository';

export class TableService {
  private tableRepository: TableRepository;

  constructor() {
    this.tableRepository = new TableRepository();
  }

  async getTables(): Promise<Table[]> {
    return await this.tableRepository.getAllTables();
  }

  async getTableById(id: string): Promise<Table | undefined> {
    return await this.tableRepository.getTableById(id);
  }

  async getTableByNumber(number: number): Promise<Table | undefined> {
    return await this.tableRepository.getTableByNumber(number);
  }

  async getTablesByStatus(status: TableStatus): Promise<Table[]> {
    return await this.tableRepository.getTablesByStatus(status);
  }

  async createTable(dto: CreateTableDto): Promise<Table> {
    // Validate input
    if (dto.number <= 0) {
      throw new Error('Số bàn phải lớn hơn 0');
    }
    if (dto.capacity <= 0) {
      throw new Error('Sức chứa phải lớn hơn 0');
    }

    // Check if table number already exists
    const existingTable = await this.tableRepository.getTableByNumber(dto.number);
    if (existingTable) {
      throw new Error(`Bàn số ${dto.number} đã tồn tại`);
    }

    return await this.tableRepository.createTable(dto);
  }

  async updateTable(id: string, dto: UpdateTableDto): Promise<Table | undefined> {
    // Validate input
    if (dto.capacity !== undefined && dto.capacity <= 0) {
      throw new Error('Sức chứa phải lớn hơn 0');
    }

    return await this.tableRepository.updateTable(id, dto);
  }

  async updateTableStatus(id: string, status: TableStatus): Promise<Table | undefined> {
    return await this.tableRepository.updateTable(id, { status });
  }

  async assignOrderToTable(tableId: string, orderId: string): Promise<Table | undefined> {
    return await this.tableRepository.updateTable(tableId, {
      currentOrderId: orderId,
      status: TableStatus.OCCUPIED,
    });
  }

  async clearTable(id: string): Promise<Table | undefined> {
    return await this.tableRepository.updateTable(id, {
      currentOrderId: undefined,
      status: TableStatus.CLEANING,
    });
  }

  async makeTableAvailable(id: string): Promise<Table | undefined> {
    return await this.tableRepository.updateTable(id, {
      status: TableStatus.AVAILABLE,
      currentOrderId: undefined,
    });
  }

  async deleteTable(id: string): Promise<boolean> {
    const table = await this.tableRepository.getTableById(id);
    if (table && table.status === TableStatus.OCCUPIED) {
      throw new Error('Không thể xóa bàn đang có khách');
    }
    return await this.tableRepository.deleteTable(id);
  }

  async getAvailableTables(): Promise<Table[]> {
    return await this.tableRepository.getTablesByStatus(TableStatus.AVAILABLE);
  }

  async getOccupiedTables(): Promise<Table[]> {
    return await this.tableRepository.getTablesByStatus(TableStatus.OCCUPIED);
  }

  async getTableUtilization(): Promise<number> {
    const allTables = await this.tableRepository.getAllTables();
    const occupiedTables = await this.getOccupiedTables();
    if (allTables.length === 0) return 0;
    return (occupiedTables.length / allTables.length) * 100;
  }
}
