/**
 * Inventory Repository Interface - Domain Layer
 */

import { Inventory, InventoryTransaction } from '../entities/Inventory';

export interface IInventoryRepository {
  findById(id: string): Promise<Inventory | null>;
  findAll(filters?: {
    category?: string;
    low_stock?: boolean;
    search?: string;
  }): Promise<Inventory[]>;
  create(inventory: Omit<Inventory, 'id' | 'created_at' | 'updated_at'>): Promise<Inventory>;
  update(id: string, data: Partial<Inventory>): Promise<Inventory>;
  delete(id: string): Promise<void>;
  updateQuantity(id: string, quantity: number): Promise<Inventory>;
  
  // Transaction methods
  createTransaction(transaction: Omit<InventoryTransaction, 'id' | 'created_at'>): Promise<InventoryTransaction>;
  findTransactionsByInventoryId(inventoryId: string, limit?: number): Promise<InventoryTransaction[]>;
  findLowStockItems(): Promise<Inventory[]>;
}
