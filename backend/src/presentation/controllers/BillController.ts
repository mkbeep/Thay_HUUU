/**
 * Bill Controller — thanh toán theo session (một bill / lần)
 */

import { Request, Response, NextFunction } from 'express';
import { BillRepository } from '../../infrastructure/database/repositories/BillRepository';
import { OrderRepository } from '../../infrastructure/database/repositories/OrderRepository';
import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { AppError, NotFoundError } from '../../application/errors/AppError';
import { NotificationService } from '../../application/services/NotificationService';
import { NotificationRepository } from '../../infrastructure/database/repositories/NotificationRepository';
import { UserRepository } from '../../infrastructure/database/repositories/UserRepository';
import { NotificationType, NotificationPriority } from '../../domain/entities/Notification';
import { TableStatus } from '../../domain/entities/Table';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';
import { getSessionAutoCloseService } from '../../application/services/SessionAutoCloseService';
import type { BillLineItem } from '../../domain/entities/Bill';

export class BillController {
  private readonly billRepository = new BillRepository();
  private readonly orderRepository = new OrderRepository();
  private readonly tableRepository = new TableRepository();
  private readonly notificationService: NotificationService;
  private readonly operationRoles = ['staff', 'manager', 'admin', 'chef', 'cashier'] as const;

  constructor() {
    const notificationRepository = new NotificationRepository();
    const userRepository = new UserRepository();
    this.notificationService = new NotificationService(notificationRepository, userRepository);
  }

  private async notifyOperationRoles(payload: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    priority?: NotificationPriority;
  }) {
    await Promise.all(
      this.operationRoles.map((role) => this.notificationService.sendToRole(role, payload))
    );
  }

  private normalizeVndAmount(value: unknown): number {
    const amount = Number(value) || 0;
    return amount > 0 && amount < 1000 ? amount * 1000 : amount;
  }

  /**
   * POST /api/v1/orders/:sessionId/request-payment
   */
  requestSessionPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const paymentMethod = (req.body.payment_method || 'qr') as
        | 'qr'
        | 'cash'
        | 'card'
        | 'e_wallet';

      const session = await this.tableRepository.findSessionById(sessionId);
      if (!session?.is_active) {
        throw new AppError('Phiên bàn đã kết thúc. Vui lòng quét lại QR.', 409);
      }

      const existing = await this.billRepository.findPendingBySession(sessionId);
      if (existing) {
        res.status(200).json({
          success: true,
          message: 'Đã có yêu cầu thanh toán đang chờ xác nhận',
          data: existing,
        });
        return;
      }

      const unpaidItems = await this.orderRepository.findUnpaidItemsForBill(sessionId);
      if (unpaidItems.length === 0) {
        throw new AppError('Không có món nào cần thanh toán', 400);
      }

      const table = await this.tableRepository.findById(session.table_id);
      const billItems: BillLineItem[] = unpaidItems.map((item) => ({
        order_item_id: item.id,
        order_id: item.order_id,
        food_id: item.food_id,
        food_name: item.food_name,
        quantity: item.quantity,
        unit_price: this.normalizeVndAmount(item.unit_price),
        subtotal: this.normalizeVndAmount(item.subtotal || item.unit_price * item.quantity),
      }));

      const subtotal = billItems.reduce((sum, line) => sum + line.subtotal, 0);
      const taxAmount = Math.round(subtotal * 0.08);
      const total = subtotal + taxAmount;

      const bill = await this.billRepository.create({
        session_id: sessionId,
        table_id: session.table_id,
        table_number: table?.table_number || unpaidItems[0]?.table_number,
        payment_method: paymentMethod,
        items: billItems,
        subtotal,
        tax_amount: taxAmount,
        total,
      });

      await this.tableRepository.updateStatus(session.table_id, TableStatus.RESERVED);

      const methodLabel: Record<string, string> = {
        cash: 'tiền mặt tại bàn',
        qr: 'mã QR',
        card: 'thẻ',
        e_wallet: 'ví điện tử',
      };

      await this.notifyOperationRoles({
        type: NotificationType.PAYMENT_REQUEST,
        title: 'Yêu cầu thanh toán',
        message: `Bàn ${bill.table_number || '—'} yêu cầu thanh toán ${methodLabel[paymentMethod] || paymentMethod} - ${Number(total).toLocaleString('vi-VN')}đ`,
        data: {
          bill_id: bill.id,
          session_id: sessionId,
          payment_method: paymentMethod,
          total_amount: total,
          table_id: session.table_id,
        },
        priority: NotificationPriority.HIGH,
      });

      try {
        const socketManager = SocketManager.getInstance();
        socketManager.notifyBillCreated(bill as unknown as Record<string, unknown>);
        socketManager.notifyTableStatusChanged(session.table_id, TableStatus.RESERVED);
        socketManager.notifyTableUpdated(session.table_id);
      } catch (error) {
        console.error('WebSocket emit error (bill:created):', error);
      }

      res.status(200).json({
        success: true,
        message: 'Đã gửi yêu cầu thanh toán',
        data: bill,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/bills/pending
   */
  listPending = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const bills = await this.billRepository.findAllPending();
      res.status(200).json({ success: true, data: bills, total: bills.length });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/bills/:id/confirm-payment
   */
  confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const bill = await this.billRepository.findById(id);
      if (!bill) throw new NotFoundError('Hóa đơn không tồn tại');
      if (bill.status !== 'pending') {
        throw new AppError('Hóa đơn không ở trạng thái chờ xác nhận', 400);
      }

      const paidBill = await this.billRepository.confirmPayment(id);
      await this.billRepository.markBillItemsPaid(paidBill);

      try {
        const socketManager = SocketManager.getInstance();
        for (const line of paidBill.items) {
          socketManager.notifyOrderItemPaymentUpdated(line.order_item_id, {
            id: line.order_item_id,
            order_id: line.order_id,
            payment_status: 'paid',
            table_session_id: paidBill.session_id,
          });
        }
        socketManager.notifyBillConfirmed(paidBill as unknown as Record<string, unknown>);
        socketManager.notifyReportsUpdated({
          reason: 'bill_payment_confirmed',
          bill_id: paidBill.id,
          total_amount: paidBill.total,
        });
      } catch (error) {
        console.error('WebSocket emit error (bill:confirmed):', error);
      }

      try {
        await getSessionAutoCloseService().evaluateAutoClose(paidBill.session_id);
      } catch (error) {
        console.error('❌ Error evaluating auto-close after bill:', error);
      }

      res.status(200).json({
        success: true,
        message: 'Xác nhận thanh toán thành công',
        data: paidBill,
      });
    } catch (error) {
      next(error);
    }
  };
}
