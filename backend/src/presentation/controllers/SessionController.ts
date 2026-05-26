/**
 * Session Controller — ping, khôi phục phiên, reset bàn
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { OrderRepository } from '../../infrastructure/database/repositories/OrderRepository';
import { CartRepository } from '../../infrastructure/database/repositories/CartRepository';
import { NotFoundError, AppError } from '../../application/errors/AppError';
import { TableStatus } from '../../domain/entities/Table';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';
import { getSessionAutoCloseService } from '../../application/services/SessionAutoCloseService';
import { BillRepository } from '../../infrastructure/database/repositories/BillRepository';

export class SessionController {
  private tableRepository = new TableRepository();
  private orderRepository = new OrderRepository();
  private cartRepository = new CartRepository();
  private billRepository = new BillRepository();

  constructor(private socketManager: SocketManager) {}

  private assertToken(session: { session_token?: string }, token?: string): void {
    if (!session.session_token || !token || session.session_token !== token) {
      throw new AppError('Session token không hợp lệ', 403);
    }
  }

  /** POST /api/v1/tables/session/:sessionId/ping */
  ping = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = await this.tableRepository.findSessionById(sessionId);
      if (!session || !session.is_active) {
        throw new NotFoundError('Phiên không tồn tại hoặc đã đóng');
      }
      await this.tableRepository.updateSessionHeartbeat(sessionId);
      await getSessionAutoCloseService().onSessionActivity(sessionId);
      res.status(200).json({ success: true, message: 'Ping OK' });
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/tables/session/:sessionId/state?session_token= */
  getState = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session_token = (req.query.session_token as string) || '';
      const session = await this.tableRepository.findSessionById(sessionId);
      if (!session) {
        throw new NotFoundError('Phiên không tồn tại');
      }
      if (!session.is_active) {
        res.status(200).json({
          success: true,
          data: { session, cart: [], orders: [], active: false },
        });
        return;
      }
      this.assertToken(session, session_token);

      const cartDoc = await this.cartRepository.getBySessionId(sessionId);
      const orders = await this.orderRepository.findPublicOrdersWithItems(sessionId);
      const pendingBill = await this.billRepository.findPendingBySession(sessionId);
      res.status(200).json({
        success: true,
        data: {
          session,
          cart: cartDoc?.items || [],
          orders,
          pending_bill: pendingBill,
          active: true,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /** POST /api/v1/tables/:tableId/reset — admin reset thủ công */
  forceReset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tableId } = req.params;
      const table = await this.tableRepository.findById(tableId);
      if (!table) throw new NotFoundError('Bàn không tồn tại');

      const result = await this.tableRepository.forceResetTable(tableId);
      this.socketManager.notifyTableUpdated(tableId);
      if (result.sessionId) {
        this.socketManager.emitToTable(result.sessionId, 'session:ended', { tableId });
      }

      res.status(200).json({
        success: true,
        message: 'Đã reset bàn',
        data: { table_id: tableId, ended_session_id: result.sessionId },
      });
    } catch (error) {
      next(error);
    }
  };

  /** Tạo hoặc gắn session theo device_fingerprint */
  async resolveSessionForTable(
    tableId: string,
    customerCount: number,
    clientToken?: string,
    deviceFingerprint?: string
  ): Promise<{
    session: import('../../domain/entities/Table').TableSession;
    created: boolean;
    conflict: boolean;
    minutesSinceActive?: number;
  }> {
    const existing = await this.tableRepository.findActiveSessionByTableId(tableId);

    if (existing) {
      if (this.tableRepository.isSessionStale(existing)) {
        await this.tableRepository.endSession(existing.id);
        await this.tableRepository.updateStatus(tableId, TableStatus.AVAILABLE);
        this.socketManager.notifyTableStatusChanged(tableId, TableStatus.AVAILABLE);
      } else {
        const sameDevice =
          deviceFingerprint &&
          existing.device_fingerprint &&
          existing.device_fingerprint === deviceFingerprint;
        const sameToken =
          clientToken && existing.session_token && existing.session_token === clientToken;

        if (sameDevice || sameToken) {
          await this.tableRepository.updateSessionHeartbeat(existing.id);
          await this.tableRepository.updateStatus(tableId, TableStatus.OCCUPIED);
          return { session: existing, created: false, conflict: false };
        }

        const minutesSinceActive = this.tableRepository.minutesSinceActive(existing);
        this.socketManager.emitToAdmin('session:conflict', {
          tableId,
          sessionId: existing.id,
          minutesSinceActive,
          message: 'Có khách mới quét QR trong khi phiên cũ còn hoạt động',
        });
        return {
          session: existing,
          created: false,
          conflict: true,
          minutesSinceActive,
        };
      }
    }

    const sessionCode = uuidv4().substring(0, 8).toUpperCase();
    const session = await this.tableRepository.createSession({
      table_id: tableId,
      session_code: sessionCode,
      customer_count: customerCount,
      is_active: true,
      session_token: clientToken || uuidv4(),
      device_fingerprint: deviceFingerprint,
    });
    await this.tableRepository.updateStatus(tableId, TableStatus.OCCUPIED);
    this.socketManager.notifyTableDocumentChanged(tableId);
    return { session, created: true, conflict: false };
  }
}
