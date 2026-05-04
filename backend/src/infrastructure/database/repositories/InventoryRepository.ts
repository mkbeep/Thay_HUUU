/**
 * Inventory Repository Implementation - Infrastructure Layer
 */

import { db } from '../../config/firebase.config';
import { IInventoryRepository } from '../../../domain/repositories/IInventoryRepository';
import { Inventory, InventoryTransaction } from '../../../domain/entities/Inventory';

export class InventoryRepository implements IInventoryRepository {
  private readonly collection = db.collection('inventory');
  private readonly transactionsCollection = db.collection('inventory_transaction');

  async findById(id: string): Promise<Inventory | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Inventory;
  }

  async findAll(filters?: {
    category?: string;
    low_stock?: boolean;
    search?: string;
  }): Promise<Inventory[]> {
    let query: FirebaseFirestore.Query = this.collection;

    if (filters?.category) {
      query = query.where('category', '==', filters.category);
    }

    const snapshot = await query.get();
    let items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Inventory));

    // Filter low stock items
    if (filters?.low_stock) {
      items = items.filter(item => item.current_quantity <= item.minimum_quantity);
    }

    // Filter by search term
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(item =>
        item.item_name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    return items;
  }

  async create(inventoryData: Omit<Inventory, 'id' | 'created_at' | 'updated_at'>): Promise<Inventory> {
    const now = new Date();
    const data = {
      ...inventoryData,
      created_at: now,
      updated_at: now,
    };

    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data } as Inventory;
  }

  async update(id: string, data: Partial<Inventory>): Promise<Inventory> {
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    await this.collection.doc(id).update(updateData);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Inventory not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async updateQuantity(id: string, quantity: number): Promise<Inventory> {
    const updateData: any = {
      current_quantity: quantity,
      updated_at: new Date(),
    };

    // Nếu là restock, cập nhật last_restocked_at
    const current = await this.findById(id);
    if (current && quantity > current.current_quantity) {
      updateData.last_restocked_at = new Date();
    }

    await this.collection.doc(id).update(updateData);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Inventory not found after update');
    return updated;
  }

  // Transaction methods
  async createTransaction(
    transactionData: Omit<InventoryTransaction, 'id' | 'created_at'>
  ): Promise<InventoryTransaction> {
    const data = {
      ...transactionData,
      created_at: new Date(),
    };

    const docRef = await this.transactionsCollection.add(data);
    return { id: docRef.id, ...data } as InventoryTransaction;
  }

  async findTransactionsByInventoryId(
    inventoryId: string,
    limit?: number
  ): Promise<InventoryTransaction[]> {
    let query: FirebaseFirestore.Query = this.transactionsCollection
      .where('inventory_id', '==', inventoryId)
      .orderBy('created_at', 'desc');

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InventoryTransaction));
  }

  async findLowStockItems(): Promise<Inventory[]> {
    const snapshot = await this.collection.get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Inventory));

    return items.filter(item => item.current_quantity <= item.minimum_quantity);
  }
}
