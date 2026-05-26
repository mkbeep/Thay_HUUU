/**
 * Auto-resolve session: không ping 3 phút, hoặc unpaid=0 và bếp=0,
 * hoặc toàn bộ item bị cancel → auto_close_at = now + 3 phút.
 * Heartbeat / đơn mới hủy đếm ngược. Cron đóng session khi hết hạn.
 */

import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { OrderRepository } from '../../infrastructure/database/repositories/OrderRepository';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';
import { TableStatus } from '../../domain/entities/Table';
import {
  AUTO_CLOSE_DELAY_MS,
  AUTO_CLOSE_WARNING_BEFORE_MS,
  AUTO_CLOSE_CRON_INTERVAL_MS,
  AUTO_RESOLVE_HEARTBEAT_STALE_MS,
} from '../../domain/constants/session.constants';

function toMs(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  if (typeof value === 'object' && value !== null && '_seconds' in (value as object)) {
    return (value as { _seconds: number })._seconds * 1000;
  }
  const ms = new Date(value as string).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export class SessionAutoCloseService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly tableRepository = new TableRepository();
  private readonly orderRepository = new OrderRepository();

  start(socketManager: SocketManager): void {
    if (this.timer) return;

    const run = () => void this.runCronTick(socketManager);
    void run();
    this.timer = setInterval(run, AUTO_CLOSE_CRON_INTERVAL_MS);
    console.log('✅ Session auto-close job started (every 30 sec)');
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Ping hoặc đơn mới — hủy đếm ngược */
  async onSessionActivity(sessionId: string): Promise<void> {
    const session = await this.tableRepository.findSessionById(sessionId);
    if (!session?.is_active || !session.auto_close_at) return;
    await this.tableRepository.clearAutoClose(sessionId);
    try {
      const socketManager = SocketManager.getInstance();
      socketManager.notifyTableDocumentChanged(session.table_id);
    } catch {
      /* ignore */
    }
  }

  /**
   * Sau confirm-payment / cập nhật trạng thái món — kiểm tra 3 điều kiện auto-resolve.
   */
  async evaluateAutoClose(sessionId?: string): Promise<void> {
    if (!sessionId) return;

    const session = await this.tableRepository.findSessionById(sessionId);
    if (!session?.is_active) return;

    const [unpaidTotal, hasPendingOrPreparing, allItemsCancelled] = await Promise.all([
      this.orderRepository.getSessionUnpaidTotal(sessionId),
      this.orderRepository.hasSessionPendingOrPreparingItems(sessionId),
      this.orderRepository.areAllSessionItemsCancelled(sessionId),
    ]);

    const heartbeatMs = toMs(session.last_heartbeat || session.last_ping_at);
    const heartbeatStale =
      heartbeatMs > 0 && Date.now() - heartbeatMs >= AUTO_RESOLVE_HEARTBEAT_STALE_MS;

    const shouldSchedule =
      heartbeatStale || allItemsCancelled || (unpaidTotal === 0 && !hasPendingOrPreparing);

    if (!shouldSchedule) {
      console.log(
        `ℹ️ Auto-close skipped for session ${sessionId}: unpaid=${unpaidTotal}, pendingOrPreparing=${hasPendingOrPreparing}, allCancelled=${allItemsCancelled}, heartbeatStale=${heartbeatStale}`
      );
      if (session.auto_close_at) {
        await this.tableRepository.clearAutoClose(sessionId);
        try {
          SocketManager.getInstance().notifyTableDocumentChanged(session.table_id);
        } catch {
          /* ignore */
        }
      }
      return;
    }

    if (session.auto_close_at) return;

    const closeAt = new Date(Date.now() + AUTO_CLOSE_DELAY_MS);
    await this.tableRepository.scheduleAutoClose(sessionId, closeAt);
    console.log(`⏳ Auto-close scheduled for session ${sessionId} at ${closeAt.toISOString()}`);

    try {
      const socketManager = SocketManager.getInstance();
      const secondsLeft = Math.max(1, Math.ceil(AUTO_CLOSE_DELAY_MS / 1000));
      socketManager.notifySessionAutoClosing(session.id, session.table_id, {
        auto_close_at: closeAt.toISOString(),
        seconds_left: secondsLeft,
      });
      socketManager.notifyTableDocumentChanged(session.table_id);
    } catch {
      /* ignore */
    }
  }

  private async runCronTick(socketManager: SocketManager): Promise<void> {
    try {
      await this.scheduleStaleHeartbeatSessions(socketManager);

      const sessions = await this.tableRepository.findActiveSessionsWithAutoClose();
      const now = Date.now();

      for (const session of sessions) {
        const closeAtMs = toMs(session.auto_close_at);
        if (!closeAtMs) continue;

        if (now >= closeAtMs) {
          await this.closeSessionNow(session.id, session.table_id, socketManager);
          continue;
        }

        const warnAtMs = closeAtMs - AUTO_CLOSE_WARNING_BEFORE_MS;
        if (now >= warnAtMs && !session.closing_soon_sent_at) {
          await this.tableRepository.markClosingSoonSent(session.id);
          const secondsLeft = Math.max(0, Math.ceil((closeAtMs - now) / 1000));
          socketManager.notifySessionClosingSoon(session.id, session.table_id, {
            auto_close_at: new Date(closeAtMs).toISOString(),
            seconds_left: secondsLeft,
          });
          socketManager.notifyTableDocumentChanged(session.table_id);
        }
      }
    } catch (err) {
      console.error('Session auto-close cron error:', err);
    }
  }

  private async scheduleStaleHeartbeatSessions(socketManager: SocketManager): Promise<void> {
    const sessions = await this.tableRepository.findActiveSessions();
    const now = Date.now();

    for (const session of sessions) {
      if (session.auto_close_at) continue;

      const heartbeatMs = toMs(session.last_heartbeat || session.last_ping_at || session.started_at);
      if (!heartbeatMs || now - heartbeatMs < AUTO_RESOLVE_HEARTBEAT_STALE_MS) continue;

      const closeAt = new Date(now + AUTO_CLOSE_DELAY_MS);
      await this.tableRepository.scheduleAutoClose(session.id, closeAt);

      const secondsLeft = Math.max(1, Math.ceil(AUTO_CLOSE_DELAY_MS / 1000));
      socketManager.notifySessionAutoClosing(session.id, session.table_id, {
        auto_close_at: closeAt.toISOString(),
        seconds_left: secondsLeft,
        reason: 'heartbeat_timeout',
      });
      socketManager.notifyTableDocumentChanged(session.table_id);
      console.log(`⏳ Auto-close scheduled for stale heartbeat session ${session.id}`);
    }
  }

  async closeSessionNow(
    sessionId: string,
    tableId: string,
    socketManager?: SocketManager
  ): Promise<void> {
    const sm = socketManager || SocketManager.getInstance();
    await this.tableRepository.endSession(sessionId);
    await this.tableRepository.updateStatus(tableId, TableStatus.AVAILABLE);
    sm.emitToTable(sessionId, 'session:ended', { tableId, sessionId });
    sm.notifyTableStatusChanged(tableId, TableStatus.AVAILABLE);
    sm.notifyTableUpdated(tableId);
    sm.notifyTableDocumentChanged(tableId);
  }
}

let sharedAutoClose: SessionAutoCloseService | null = null;

export function getSessionAutoCloseService(): SessionAutoCloseService {
  if (!sharedAutoClose) sharedAutoClose = new SessionAutoCloseService();
  return sharedAutoClose;
}
