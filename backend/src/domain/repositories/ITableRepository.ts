/**
 * Table Repository Interface - Domain Layer
 */

import {
  DiningTable,
  TableWithSession,
  TableStatus,
  TableSession,
  TableSessionCustomerCartDraft,
} from '../entities/Table';

export interface ITableRepository {
  findById(id: string): Promise<DiningTable | null>;
  findByIdWithSession(id: string): Promise<TableWithSession | null>;
  findByTableNumber(tableNumber: string): Promise<DiningTable | null>;
  findAll(filters?: {
    status?: TableStatus;
    capacity?: number;
  }): Promise<DiningTable[]>;
  findAllWithSessions(): Promise<TableWithSession[]>;
  create(table: Omit<DiningTable, 'id' | 'created_at' | 'updated_at'>): Promise<DiningTable>;
  update(id: string, data: Partial<DiningTable>): Promise<DiningTable>;
  updateStatus(id: string, status: TableStatus): Promise<DiningTable>;
  delete(id: string): Promise<void>;
  
  // Table Session methods
  createSession(session: Omit<TableSession, 'id' | 'started_at'>): Promise<TableSession>;
  findSessionById(sessionId: string): Promise<TableSession | null>;
  findActiveSessionByTableId(tableId: string): Promise<TableSession | null>;
  endSession(sessionId: string): Promise<TableSession>;
  updateSessionCustomerDraft(
    sessionId: string,
    draft: TableSessionCustomerCartDraft | null
  ): Promise<void>;
}
