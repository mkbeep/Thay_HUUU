/**
 * Order Controller - Presentation Layer
 */

import { Request, Response, NextFunction } from 'express';
import { OrderRepository } from '../../infrastructure/database/repositories/OrderRepository';
import { AppError, NotFoundError } from '../../application/errors/AppError';
import { NotificationService } from '../../application/services/NotificationService';
import { NotificationRepository } from '../../infrastructure/database/repositories/NotificationRepository';
import { UserRepository } from '../../infrastructure/database/repositories/UserRepository';
import { NotificationType, NotificationPriority } from '../../domain/entities/Notification';
import { PaymentStatus } from '../../domain/entities/Order';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';
import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { DiningTable, TableSession, TableStatus } from '../../domain/entities/Table';

export class OrderController {
  private orderRepository: OrderRepository;
  private notificationService: NotificationService;
  private readonly operationRoles = ['staff', 'manager', 'admin', 'chef', 'cashier'] as const;

  constructor() {
    this.orderRepository = new OrderRepository();
    const notificationRepository = new NotificationRepository();
    const userRepository = new UserRepository();
    this.notificationService = new NotificationService(notificationRepository, userRepository);
  }

  private async notifyOperationRoles(
    payload: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, any>;
      priority?: NotificationPriority;
    }
  ) {
    await this.notificationService.sendToRolesDeduped([...this.operationRoles], payload);
  }

  /** Hiển thị "Bàn {số}" cho admin — không cần phiên đang active. */
  private async resolveTableDisplayLabel(tableSessionId: string | undefined): Promise<string> {
    if (!tableSessionId || !String(tableSessionId).trim()) return '—';
    const tableRepo = new TableRepository();
    const raw = String(tableSessionId).trim();

    const session = await tableRepo.findSessionById(raw);
    if (session) {
      const table = await tableRepo.findById(session.table_id);
      if (table?.table_number) return `Bàn ${table.table_number}`;
    }

    const tableByNumber = await tableRepo.findByTableNumber(raw);
    if (tableByNumber?.table_number) return `Bàn ${tableByNumber.table_number}`;

    return 'Bàn (chưa rõ)';
  }

  private async enrichOrderForAdmin<T extends { table_session_id?: string }>(order: T) {
    const table_display_label = await this.resolveTableDisplayLabel(order.table_session_id);
    return { ...order, table_display_label };
  }

  /**
   * table_session_id trên đơn có thể là:
   * - id tài liệu Firestore của table_session (chuẩn), hoặc
   * - legacy: chuỗi số bàn (table_number) mà app khách từng gửi
   */
  private async resolveTableAndActiveSession(
    tableSessionId: string | undefined
  ): Promise<{ table: DiningTable; session: TableSession } | null> {
    if (!tableSessionId || !String(tableSessionId).trim()) return null;
    const tableRepo = new TableRepository();
    const raw = String(tableSessionId).trim();

    let session = await tableRepo.findSessionById(raw);
    if (session?.is_active) {
      const table = await tableRepo.findById(session.table_id);
      if (table) return { table, session };
    }

    const table = await tableRepo.findByTableNumber(raw);
    if (!table) return null;
    session = await tableRepo.findActiveSessionByTableId(table.id);
    if (!session?.is_active) return null;
    return { table, session };
  }

  /**
   * GET /api/v1/orders
   */
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, order_type, table_session_id, from_date, to_date } = req.query;

      const orders = await this.orderRepository.findAll({
        status: status as any,
        order_type: order_type as any,
        table_session_id: table_session_id as string,
        from_date: from_date ? new Date(from_date as string) : undefined,
        to_date: to_date ? new Date(to_date as string) : undefined,
      });

      const data = await Promise.all(orders.map((o) => this.enrichOrderForAdmin(o)));

      res.status(200).json({
        success: true,
        data,
        total: data.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/orders/public?table_session_id=...
   * Public endpoint cho app khách đồng bộ trạng thái đơn theo bàn
   */
  getPublicByTableSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { table_session_id } = req.query;
      if (!table_session_id) {
        res.status(400).json({
          success: false,
          message: 'Missing table_session_id',
        });
        return;
      }

      const orders = await this.orderRepository.findByTableSessionWithItems(
        table_session_id as string
      );

      res.status(200).json({
        success: true,
        data: orders,
        total: orders.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/orders/:id
   */
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const order = await this.orderRepository.findByIdWithItems(id);

      if (!order) {
        throw new NotFoundError('Đơn hàng không tồn tại');
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/orders
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderNumber = await this.orderRepository.generateOrderNumber();
      
      const order = await this.orderRepository.create({
        ...req.body,
        order_number: orderNumber,
        customer_id: req.user?.userId,
        payment_status: PaymentStatus.UNPAID,
      });

      const tableLabel = await this.resolveTableDisplayLabel(order.table_session_id);
      await this.notifyOperationRoles({
        type: NotificationType.ORDER_CREATED,
        title: 'Đơn hàng mới',
        message: `${tableLabel} — Đơn ${orderNumber} vừa được tạo`,
        data: { order_id: order.id, table_display_label: tableLabel },
        priority: NotificationPriority.HIGH,
      });

      // 🔥 Emit WebSocket event
      try {
        const socketManager = SocketManager.getInstance();
        const payload = await this.enrichOrderForAdmin(order);
        socketManager.notifyOrderCreated(payload);
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thành công',
        data: await this.enrichOrderForAdmin(order),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/orders/:id/status
   */
  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await this.orderRepository.updateStatus(id, status);

      // Gửi notification cho customer
      if (order.customer_id) {
        await this.notificationService.sendToUser({
          user_id: order.customer_id,
          type: NotificationType.ORDER_UPDATED,
          title: 'Cập nhật đơn hàng',
          message: `Đơn hàng ${order.order_number} đã chuyển sang trạng thái ${status}`,
          data: { order_id: order.id, status },
          priority: NotificationPriority.NORMAL,
        });
      }

      // 🔥 Emit WebSocket event
      try {
        const socketManager = SocketManager.getInstance();
        const payload = await this.enrichOrderForAdmin(order);
        socketManager.notifyOrderStatusChanged(order.id, status, payload);
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: await this.enrichOrderForAdmin(order),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/orders/:id/request-payment
   * Khách gửi yêu cầu thanh toán
   */
  requestPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const paymentMethod = req.body.payment_method || 'qr';
      const order = await this.orderRepository.requestPayment(id, paymentMethod);

      const tableLabel = await this.resolveTableDisplayLabel(order.table_session_id);
      await this.notifyOperationRoles({
        type: NotificationType.PAYMENT_REQUEST,
        title: 'Yêu cầu thanh toán',
        message: `${tableLabel} — Đơn ${order.order_number} yêu cầu thanh toán (${paymentMethod})`,
        data: { order_id: order.id, payment_method: paymentMethod, table_display_label: tableLabel },
        priority: NotificationPriority.HIGH,
      });

      try {
        const socketManager = SocketManager.getInstance();
        const payload = await this.enrichOrderForAdmin(order);
        socketManager.notifyOrderUpdated(payload);
      } catch (error) {
        console.error('WebSocket emit error (request-payment):', error);
      }

      // Bàn admin: chuyển sang "Thanh toán" (reserved) khi có yêu cầu TT
      try {
        const ctx = await this.resolveTableAndActiveSession(order.table_session_id);
        if (ctx && ctx.table.status === TableStatus.OCCUPIED) {
          const tableRepo = new TableRepository();
          await tableRepo.updateStatus(ctx.table.id, TableStatus.RESERVED);
          SocketManager.getInstance().notifyTableUpdated(ctx.table.id);
        }
      } catch (e) {
        console.error('Table billing status update (request-payment):', e);
      }

      res.status(200).json({
        success: true,
        message: 'Đã gửi yêu cầu thanh toán',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/orders/:id/cancel
   * Khách hủy đơn (chỉ pending / confirmed). body: { table_session_id?: string }
   */
  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tableSessionId = req.body?.table_session_id as string | undefined;

      let order;
      try {
        order = await this.orderRepository.cancelIfAllowed(id, tableSessionId);
      } catch (e: any) {
        if (e?.message === 'Order not found') {
          throw new NotFoundError('Đơn hàng không tồn tại');
        }
        if (e?.message === 'TABLE_MISMATCH') {
          throw new AppError('Không khớp thông tin bàn', 403);
        }
        if (e?.message === 'CANCEL_NOT_ALLOWED') {
          throw new AppError(
            'Chỉ có thể hủy khi đơn ở trạng thái "mới" hoặc "đã nhận", trước khi bếp bắt đầu nấu.',
            400
          );
        }
        throw e;
      }

      try {
        const socketManager = SocketManager.getInstance();
        const payload = await this.enrichOrderForAdmin(order);
        socketManager.notifyOrderUpdated(payload);
      } catch (error) {
        console.error('WebSocket emit error (cancel):', error);
      }

      res.status(200).json({
        success: true,
        message: 'Đã hủy đơn hàng',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/orders/:id/confirm-payment
   * Thu ngân/admin xác nhận đã nhận tiền
   */
  confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const order = await this.orderRepository.confirmPayment(id);

      // 🔥 Emit WebSocket event trước khi xóa
      try {
        const socketManager = SocketManager.getInstance();
        const payload = await this.enrichOrderForAdmin(order);
        socketManager.notifyOrderUpdated(payload);
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      // ✅ Kiểm tra xem còn order nào chưa thanh toán của session này không
      if (order.table_session_id) {
        const remainingOrders = await this.orderRepository.findByTableSession(order.table_session_id);
        const unpaidOrders = remainingOrders.filter(o => 
          o.id !== order.id && o.payment_status !== 'paid'
        );

        console.log(`📊 Session ${order.table_session_id}: ${unpaidOrders.length} unpaid orders remaining`);

        // Nếu không còn order nào chưa thanh toán → Cập nhật bàn về available
        if (unpaidOrders.length === 0) {
          try {
            const tableRepository = new TableRepository();
            const ctx = await this.resolveTableAndActiveSession(order.table_session_id);
            if (ctx?.session?.is_active) {
              await tableRepository.endSession(ctx.session.id);
              await tableRepository.updateStatus(ctx.table.id, TableStatus.AVAILABLE);
              console.log(`✅ Table ${ctx.table.id} set to available - all orders paid`);
              SocketManager.getInstance().notifyTableUpdated(ctx.table.id);
            }
          } catch (error) {
            console.error('❌ Error updating table status:', error);
          }
        }
      }

      // 🗑️ XÓA ORDER ĐÃ THANH TOÁN
      await this.orderRepository.delete(id);
      console.log(`🗑️ Deleted paid order: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Xác nhận thanh toán và xóa đơn hàng thành công',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/orders/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.orderRepository.delete(id);

      res.status(200).json({
        success: true,
        message: 'Xóa đơn hàng thành công',
      });
    } catch (error) {
      next(error);
    }
  };
}
