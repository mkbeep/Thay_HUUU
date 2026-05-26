/**
 * Đóng session zombie (không ping > 15 phút), chạy mỗi 5 phút.
 */

import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';
import { SESSION_CLEANUP_INTERVAL_MS } from '../../domain/constants/session.constants';

export class SessionCleanupService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly tableRepository = new TableRepository();

  start(socketManager: SocketManager): void {
    if (this.timer) return;

    const run = async () => {
      try {
        const tableIds = await this.tableRepository.cleanupZombieSessions();
        for (const tableId of tableIds) {
          socketManager.notifyTableStatusChanged(tableId, 'available');
          socketManager.notifyTableUpdated(tableId);
        }
        if (tableIds.length > 0) {
          console.log(`🧹 Closed ${tableIds.length} stale table session(s)`);
        }
      } catch (err) {
        console.error('Session cleanup error:', err);
      }
    };

    void run();
    this.timer = setInterval(() => void run(), SESSION_CLEANUP_INTERVAL_MS);
    console.log('✅ Session cleanup job started (every 5 min)');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
