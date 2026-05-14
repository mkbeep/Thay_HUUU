/**
 * Table Repository Implementation - Infrastructure Layer
 */

import { db } from '../../config/firebase.config';
import { ITableRepository } from '../../../domain/repositories/ITableRepository';
import {
  DiningTable,
  TableWithSession,
  TableStatus,
  TableSession,
  TableSessionCustomerCartDraft,
} from '../../../domain/entities/Table';

export class TableRepository implements ITableRepository {
  private readonly collection = db.collection('dining_table');
  private readonly sessionsCollection = db.collection('table_session');

  async findById(id: string): Promise<DiningTable | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as DiningTable;
  }

  async findByIdWithSession(id: string): Promise<TableWithSession | null> {
    const table = await this.findById(id);
    if (!table) return null;

    const session = await this.findActiveSessionByTableId(id);
    return { ...table, current_session: session || undefined };
  }

  async findByTableNumber(tableNumber: string): Promise<DiningTable | null> {
    const snapshot = await this.collection
      .where('table_number', '==', tableNumber)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as DiningTable;
  }

  async findByTableNumberWithSession(tableNumber: string | number): Promise<TableWithSession | null> {
    // Convert to string for consistent comparison
    const tableNumberStr = String(tableNumber);
    
    const snapshot = await this.collection
      .where('table_number', '==', tableNumberStr)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const table = { id: doc.id, ...doc.data() } as DiningTable;
    const session = await this.findActiveSessionByTableId(table.id);
    
    return { ...table, current_session: session || undefined };
  }

  async findAll(filters?: {
    status?: TableStatus;
    capacity?: number;
  }): Promise<DiningTable[]> {
    let query: FirebaseFirestore.Query = this.collection;

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.capacity) {
      query = query.where('capacity', '>=', filters.capacity);
    }

    query = query.orderBy('table_number', 'asc');

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DiningTable));
  }

  async findAllWithSessions(): Promise<TableWithSession[]> {
    const tables = await this.findAll();

    const sessionsSnapshot = await this.sessionsCollection
      .where('is_active', '==', true)
      .get();

    const sessionByTableId = new Map<string, TableSession>();
    for (const doc of sessionsSnapshot.docs) {
      const s = { id: doc.id, ...doc.data() } as TableSession;
      sessionByTableId.set(s.table_id, s);
    }

    return tables.map((table) => ({
      ...table,
      current_session: sessionByTableId.get(table.id),
    }));
  }

  async create(tableData: Omit<DiningTable, 'id' | 'created_at' | 'updated_at'>): Promise<DiningTable> {
    const now = new Date();
    const data = {
      ...tableData,
      created_at: now,
      updated_at: now,
    };

    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data } as DiningTable;
  }

  async update(id: string, data: Partial<DiningTable>): Promise<DiningTable> {
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    await this.collection.doc(id).update(updateData);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Table not found after update');
    return updated;
  }

  async updateStatus(id: string, status: TableStatus): Promise<DiningTable> {
    await this.collection.doc(id).update({
      status,
      updated_at: new Date(),
    });
    
    const updated = await this.findById(id);
    if (!updated) throw new Error('Table not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  // Table Session methods
  async createSession(sessionData: Omit<TableSession, 'id' | 'started_at'>): Promise<TableSession> {
    const data = {
      ...sessionData,
      started_at: new Date(),
    };

    const docRef = await this.sessionsCollection.add(data);
    return { id: docRef.id, ...data } as TableSession;
  }

  async findSessionById(sessionId: string): Promise<TableSession | null> {
    const doc = await this.sessionsCollection.doc(sessionId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as TableSession;
  }

  async findActiveSessionByTableId(tableId: string): Promise<TableSession | null> {
    const snapshot = await this.sessionsCollection
      .where('table_id', '==', tableId)
      .where('is_active', '==', true)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as TableSession;
  }

  async endSession(sessionId: string): Promise<TableSession> {
    await this.sessionsCollection.doc(sessionId).update({
      ended_at: new Date(),
      is_active: false,
    });

    const session = await this.findSessionById(sessionId);
    if (!session) throw new Error('Session not found after update');
    return session;
  }

  async updateSessionCustomerDraft(
    sessionId: string,
    draft: TableSessionCustomerCartDraft | null
  ): Promise<void> {
    const ref = this.sessionsCollection.doc(sessionId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new Error('Session not found');
    }
    await ref.update({
      customer_cart_draft: draft,
    });
  }
}
