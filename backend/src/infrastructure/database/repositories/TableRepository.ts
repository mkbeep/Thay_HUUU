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
  SessionCartLine,
} from '../../../domain/entities/Table';
import { SESSION_STALE_AFTER_MS } from '../../../domain/constants/session.constants';
import { CartRepository } from './CartRepository';
import { OrderRepository } from './OrderRepository';
import { OrderStatus, PaymentStatus } from '../../../domain/entities/Order';
import { v4 as uuidv4 } from 'uuid';

export class TableRepository implements ITableRepository {
  private readonly collection = db.collection('dining_table');
  private readonly sessionsCollection = db.collection('table_session');
  private readonly cartRepository = new CartRepository();
  private readonly orderRepository = new OrderRepository();

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

  getLastHeartbeatMs(session: TableSession): number {
    const hb = session.last_heartbeat || session.last_ping_at;
    if (!hb) return 0;
    if (hb instanceof Date) return hb.getTime();
    if (typeof (hb as { toDate?: () => Date }).toDate === 'function') {
      return (hb as { toDate: () => Date }).toDate().getTime();
    }
    if (typeof hb === 'object' && hb !== null && '_seconds' in (hb as object)) {
      return (hb as { _seconds: number })._seconds * 1000;
    }
    const ms = new Date(hb).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  }

  minutesSinceActive(session: TableSession): number {
    const last = this.getLastHeartbeatMs(session);
    if (!last) {
      return Math.floor(
        (Date.now() - new Date(session.started_at).getTime()) / 60_000
      );
    }
    return Math.floor((Date.now() - last) / 60_000);
  }

  isSessionStale(session: TableSession): boolean {
    if (!session.is_active) return true;
    const last = this.getLastHeartbeatMs(session);
    if (!last) {
      return Date.now() - new Date(session.started_at).getTime() > SESSION_STALE_AFTER_MS;
    }
    return Date.now() - last > SESSION_STALE_AFTER_MS;
  }

  // Table Session methods
  async createSession(
    sessionData: Omit<
      TableSession,
      'id' | 'started_at' | 'session_token' | 'last_heartbeat' | 'last_ping_at' | 'cart'
    > & {
      session_token?: string;
      device_fingerprint?: string;
    }
  ): Promise<TableSession> {
    const now = new Date();
    const data = {
      ...sessionData,
      session_token: sessionData.session_token || uuidv4(),
      device_fingerprint: sessionData.device_fingerprint,
      last_heartbeat: now,
      started_at: now,
    };

    const docRef = await this.sessionsCollection.add(data);
    return { id: docRef.id, ...data } as TableSession;
  }

  async updateSessionHeartbeat(sessionId: string): Promise<void> {
    await this.sessionsCollection.doc(sessionId).update({
      last_heartbeat: new Date(),
    });
  }

  async clearAutoClose(sessionId: string): Promise<void> {
    await this.sessionsCollection.doc(sessionId).update({
      auto_close_at: null,
      closing_soon_sent_at: null,
    });
  }

  async scheduleAutoClose(sessionId: string, at: Date): Promise<void> {
    await this.sessionsCollection.doc(sessionId).update({
      auto_close_at: at,
      closing_soon_sent_at: null,
    });
  }

  async markClosingSoonSent(sessionId: string): Promise<void> {
    await this.sessionsCollection.doc(sessionId).update({
      closing_soon_sent_at: new Date(),
    });
  }

  async findActiveSessionsWithAutoClose(): Promise<TableSession[]> {
    const snapshot = await this.sessionsCollection.where('is_active', '==', true).get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as TableSession))
      .filter((s) => s.auto_close_at != null);
  }

  async findActiveSessions(): Promise<TableSession[]> {
    const snapshot = await this.sessionsCollection.where('is_active', '==', true).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TableSession));
  }

  /** @deprecated */
  async updateSessionPing(sessionId: string): Promise<void> {
    return this.updateSessionHeartbeat(sessionId);
  }

  async updateSessionCart(sessionId: string, cart: SessionCartLine[]): Promise<TableSession> {
    await this.sessionsCollection.doc(sessionId).update({
      cart,
      last_ping_at: new Date(),
    });
    const session = await this.findSessionById(sessionId);
    if (!session) throw new Error('Session not found');
    return session;
  }

  async findStaleActiveSessions(): Promise<TableSession[]> {
    const snapshot = await this.sessionsCollection.where('is_active', '==', true).get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as TableSession))
      .filter((s) => this.isSessionStale(s));
  }

  async cleanupZombieSessions(): Promise<string[]> {
    const stale = await this.findStaleActiveSessions();
    const closedTableIds: string[] = [];
    for (const session of stale) {
      const orders = await this.orderRepository.findByTableSession(session.id);
      const hasUnsettledOrders = orders.some(
        (order) =>
          order.status !== OrderStatus.CANCELLED &&
          order.payment_status !== PaymentStatus.PAID
      );
      if (hasUnsettledOrders) continue;

      await this.endSession(session.id);
      await this.updateStatus(session.table_id, TableStatus.AVAILABLE);
      closedTableIds.push(session.table_id);
    }
    return closedTableIds;
  }

  /** @deprecated */
  async closeStaleSessions(): Promise<string[]> {
    return this.cleanupZombieSessions();
  }

  async forceResetTable(tableId: string): Promise<{ sessionId?: string }> {
    const session = await this.findActiveSessionByTableId(tableId);
    if (session) {
      await this.sessionsCollection.doc(session.id).update({
        ended_at: new Date(),
        is_active: false,
        auto_close_at: null,
        closing_soon_sent_at: null,
      });
      await this.cartRepository.deleteBySessionId(session.id);
    }
    await this.updateStatus(tableId, TableStatus.AVAILABLE);
    return { sessionId: session?.id };
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
      auto_close_at: null,
      closing_soon_sent_at: null,
    });
    await this.cartRepository.deleteBySessionId(sessionId);

    const session = await this.findSessionById(sessionId);
    if (!session) throw new Error('Session not found after update');
    return session;
  }
}
