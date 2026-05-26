/**
 * Firestore onSnapshot — lắng nghe document bàn/đơn đang active, emit Socket.IO
 */

import { db } from '../../infrastructure/config/firebase.config';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';
import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { OrderRepository } from '../../infrastructure/database/repositories/OrderRepository';
import { attachCustomerMenuUrl } from '../../infrastructure/utils/tableResponse';

type Unsubscribe = () => void;

export class FirestoreRealtimeService {
  private tableUnsubs = new Map<string, Unsubscribe>();
  private orderUnsubs = new Map<string, Unsubscribe>();
  private sessionUnsub: Unsubscribe | null = null;
  private readonly tableRepository = new TableRepository();
  private readonly orderRepository = new OrderRepository();

  start(socketManager: SocketManager): void {
    if (this.sessionUnsub) return;

    this.sessionUnsub = db
      .collection('table_session')
      .where('is_active', '==', true)
      .onSnapshot(
        async (snapshot) => {
          const activeTableIds = new Set<string>();
          const activeOrderIds = new Set<string>();

          for (const doc of snapshot.docs) {
            const session = { id: doc.id, ...doc.data() } as {
              id: string;
              table_id: string;
              is_active: boolean;
            };
            if (!session.is_active || !session.table_id) continue;
            activeTableIds.add(session.table_id);

            const orders = await this.orderRepository.findByTableSession(session.id);
            orders.forEach((o) => activeOrderIds.add(o.id));
          }

          this.syncTableWatchers(activeTableIds, socketManager);
          this.syncOrderWatchers(activeOrderIds, socketManager);
        },
        (err) => console.error('Firestore session watch error:', err)
      );

    console.log('✅ Firestore realtime watchers started');
  }

  stop(): void {
    this.sessionUnsub?.();
    this.sessionUnsub = null;
    this.tableUnsubs.forEach((u) => u());
    this.tableUnsubs.clear();
    this.orderUnsubs.forEach((u) => u());
    this.orderUnsubs.clear();
  }

  private syncTableWatchers(activeIds: Set<string>, socketManager: SocketManager): void {
    for (const [tableId, unsub] of this.tableUnsubs) {
      if (!activeIds.has(tableId)) {
        unsub();
        this.tableUnsubs.delete(tableId);
      }
    }
    for (const tableId of activeIds) {
      if (this.tableUnsubs.has(tableId)) continue;
      const unsub = db.collection('dining_table').doc(tableId).onSnapshot(
        async (doc) => {
          if (!doc.exists) return;
          const withSession = await this.tableRepository.findByIdWithSession(tableId);
          if (!withSession) return;
          socketManager.notifyTableUpdated(tableId, {
            table: attachCustomerMenuUrl(withSession),
          });
        },
        (err) => console.error(`Table watch error ${tableId}:`, err)
      );
      this.tableUnsubs.set(tableId, unsub);
    }
  }

  private syncOrderWatchers(activeIds: Set<string>, socketManager: SocketManager): void {
    for (const [orderId, unsub] of this.orderUnsubs) {
      if (!activeIds.has(orderId)) {
        unsub();
        this.orderUnsubs.delete(orderId);
      }
    }
    for (const orderId of activeIds) {
      if (this.orderUnsubs.has(orderId)) continue;
      const unsub = db.collection('orders').doc(orderId).onSnapshot(
        async (doc) => {
          if (!doc.exists) return;
          const order = await this.orderRepository.findByIdWithItems(orderId);
          if (order) socketManager.notifyOrderUpdated(order);
        },
        (err) => console.error(`Order watch error ${orderId}:`, err)
      );
      this.orderUnsubs.set(orderId, unsub);
    }
  }
}
