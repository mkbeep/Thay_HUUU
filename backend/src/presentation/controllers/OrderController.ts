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
import { TableStatus } from '../../domain/entities/Table';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';
import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { getSessionAutoCloseService } from '../../application/services/SessionAutoCloseService';

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
    await Promise.all(
      this.operationRoles.map((role) => this.notificationService.sendToRole(role, payload))
    );
  }

  private async markSessionBilling(tableSessionId?: string): Promise<void> {
    if (!tableSessionId) return;

    const tableRepository = new TableRepository();
    const session = await tableRepository.findSessionById(tableSessionId);
    if (!session?.is_active) return;

    await tableRepository.updateStatus(session.table_id, TableStatus.RESERVED);

    try {
      const socketManager = SocketManager.getInstance();
      socketManager.notifyTableStatusChanged(session.table_id, TableStatus.RESERVED);
      socketManager.notifyTableUpdated(session.table_id);
    } catch (error) {
      console.error('WebSocket emit error (table billing):', error);
    }
  }

  private async scheduleAutoCloseIfFullyPaid(tableSessionId?: string): Promise<void> {
    await getSessionAutoCloseService().evaluateAutoClose(tableSessionId);
  }

  /**
   * GET /api/v1/orders
   */
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, order_type, table_session_id, from_date, to_date } = req.query;

      const orders = await this.orderRepository.findAllWithItems({
        status: status as any,
        order_type: order_type as any,
        table_session_id: table_session_id as string,
        from_date: from_date ? new Date(from_date as string) : undefined,
        to_date: to_date ? new Date(to_date as string) : undefined,
      });

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

      const orders = await this.orderRepository.findPublicOrdersWithItems(
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
      let tableNumber = req.body.table_number;

      if (!tableNumber && req.body.table_session_id) {
        const tableRepository = new TableRepository();
        const session = await tableRepository.findSessionById(req.body.table_session_id);
        if (!session?.is_active) {
          throw new AppError('Phiên bàn đã kết thúc. Vui lòng quét lại QR hoặc gọi nhân viên.', 409);
        }
        if (await this.orderRepository.hasPendingPaymentInSession(req.body.table_session_id)) {
          throw new AppError('Bàn đang chờ xác nhận thanh toán. Vui lòng gọi nhân viên nếu muốn gọi thêm món.', 409);
        }
        if (session?.table_id) {
          const table = await tableRepository.findById(session.table_id);
          tableNumber = table?.table_number;
        }
      }
      
      const order = await this.orderRepository.create({
        ...req.body,
        table_number: tableNumber,
        order_number: orderNumber,
        customer_id: req.user?.userId,
        payment_status: PaymentStatus.UNPAID,
      });

      // Gửi notification cho toàn bộ bộ phận vận hành (staff/manager/admin)
      await this.notifyOperationRoles({
        type: NotificationType.ORDER_CREATED,
        title: 'Đơn hàng mới',
        message: `Đơn hàng ${orderNumber} vừa được tạo`,
        data: { order_id: order.id },
        priority: NotificationPriority.HIGH,
      });

      const orderWithItems = await this.orderRepository.findByIdWithItems(order.id);

      if (req.body.table_session_id) {
        await getSessionAutoCloseService().onSessionActivity(req.body.table_session_id);
      }

      // 🔥 Emit WebSocket event
      try {
        const socketManager = SocketManager.getInstance();
        socketManager.notifyOrderCreated(orderWithItems || order);
        socketManager.notifyReportsUpdated({ reason: 'order_created', order_id: order.id });
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thành công',
        data: orderWithItems || order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/orders/items/:itemId/status
   */
  updateItemStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { itemId } = req.params;
      const { status } = req.body;
      let item;
      try {
        item = await this.orderRepository.updateItemStatus(itemId, status);
      } catch (e: any) {
        if (e?.message === 'ORDER_ITEM_NOT_FOUND') {
          throw new NotFoundError('Món không tồn tại');
        }
        throw e;
      }

      try {
        const socketManager = SocketManager.getInstance();
        socketManager.notifyOrderItemStatusUpdated(itemId, status, { ...item });
        const orderWithItems = await this.orderRepository.findByIdWithItems(item.order_id);
        if (orderWithItems) socketManager.notifyOrderUpdated(orderWithItems);
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      if (item.table_session_id) {
        try {
          await this.scheduleAutoCloseIfFullyPaid(item.table_session_id);
        } catch (error) {
          console.error('❌ Error evaluating auto-close after item status:', error);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái món thành công',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/orders/items/:itemId/payment
   */
  updateItemPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { itemId } = req.params;
      const paymentMethod = req.body.payment_method as
        | 'qr'
        | 'cash'
        | 'card'
        | 'e_wallet'
        | undefined;

      let item;
      try {
        item = await this.orderRepository.updateItemPayment(itemId, paymentMethod);
      } catch (e: any) {
        if (e?.message === 'ORDER_ITEM_NOT_FOUND') {
          throw new NotFoundError('Món không tồn tại');
        }
        throw e;
      }

      const order = await this.orderRepository.findById(item.order_id);

      try {
        const socketManager = SocketManager.getInstance();
        if (order) socketManager.notifyOrderUpdated(order);
        socketManager.notifyOrderItemPaymentUpdated(itemId, { ...item });
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      if (item.table_session_id) {
        await this.scheduleAutoCloseIfFullyPaid(item.table_session_id);
      }

      try {
        SocketManager.getInstance().notifyReportsUpdated({
          reason: 'item_payment_updated',
          item_id: itemId,
        });
      } catch {
        /* ignore */
      }

      res.status(200).json({
        success: true,
        message: 'Đã đánh dấu món đã thanh toán',
        data: item,
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
        socketManager.notifyOrderStatusChanged(order.id, status, order);
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      if (order.table_session_id) {
        try {
          await this.scheduleAutoCloseIfFullyPaid(order.table_session_id);
        } catch (error) {
          console.error('❌ Error evaluating auto-close after order status:', error);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/orders/request-payment-batch
   * Thanh toán một phần — chỉ các order id được chọn
   */
  requestPaymentBatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { order_ids, payment_method = 'qr' } = req.body as {
        order_ids?: string[];
        payment_method?: 'qr' | 'cash' | 'card' | 'e_wallet';
      };
      if (!Array.isArray(order_ids) || order_ids.length === 0) {
        res.status(400).json({ success: false, message: 'order_ids bắt buộc' });
        return;
      }

      const orders = await this.orderRepository.requestPaymentForOrders(
        order_ids,
        payment_method
      );

      const methodLabel: Record<string, string> = {
        cash: 'tiền mặt tại bàn',
        qr: 'mã QR',
        card: 'thẻ',
        e_wallet: 'ví điện tử',
      };

      for (const order of orders) {
        await this.markSessionBilling(order.table_session_id);

        await this.notifyOperationRoles({
          type: NotificationType.PAYMENT_REQUEST,
          title: 'Yêu cầu thanh toán',
          message: `Đơn ${order.order_number} yêu cầu thanh toán ${methodLabel[payment_method] || payment_method} - ${Number(order.total_amount || 0).toLocaleString('vi-VN')}đ`,
          data: {
            order_id: order.id,
            payment_method,
            total_amount: order.total_amount,
            table_session_id: order.table_session_id,
          },
          priority: NotificationPriority.HIGH,
        });

        if (order.table_session_id) {
          try {
            const socketManager = SocketManager.getInstance();
            socketManager.notifyOrderUpdated(order);
            socketManager.notifyPaymentRequested(order);
          } catch {
            /* ignore */
          }
        }
      }

      res.status(200).json({
        success: true,
        message: 'Đã gửi yêu cầu thanh toán',
        data: orders,
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

      await this.markSessionBilling(order.table_session_id);

      const methodLabel: Record<string, string> = {
        cash: 'tiền mặt tại bàn',
        qr: 'mã QR',
        card: 'thẻ',
        e_wallet: 'ví điện tử',
      };

      await this.notifyOperationRoles({
        type: NotificationType.PAYMENT_REQUEST,
        title: 'Yêu cầu thanh toán',
        message: `Đơn ${order.order_number} yêu cầu thanh toán ${methodLabel[paymentMethod] || paymentMethod} - ${Number(order.total_amount || 0).toLocaleString('vi-VN')}đ`,
        data: {
          order_id: order.id,
          payment_method: paymentMethod,
          total_amount: order.total_amount,
          table_session_id: order.table_session_id,
        },
        priority: NotificationPriority.HIGH,
      });

      try {
        const socketManager = SocketManager.getInstance();
        socketManager.notifyOrderUpdated(order);
        socketManager.notifyPaymentRequested(order);
      } catch (error) {
        console.error('WebSocket emit error (request-payment):', error);
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
        socketManager.notifyOrderUpdated(order);
      } catch (error) {
        console.error('WebSocket emit error (cancel):', error);
      }

      if (order.table_session_id) {
        try {
          await this.scheduleAutoCloseIfFullyPaid(order.table_session_id);
        } catch (error) {
          console.error('❌ Error evaluating auto-close after cancel:', error);
        }
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
      const orderWithItems = await this.orderRepository.findByIdWithItems(id);

      // 🔥 Emit WebSocket event trước khi xóa
      try {
        const socketManager = SocketManager.getInstance();
        socketManager.notifyOrderUpdated(orderWithItems || order);
        socketManager.notifyPaymentConfirmed(orderWithItems || order);
        for (const item of orderWithItems?.items || []) {
          socketManager.notifyOrderItemPaymentUpdated(item.id, {
            ...item,
            order_id: order.id,
            table_session_id: order.table_session_id,
          });
        }
        socketManager.notifyReportsUpdated({
          reason: 'payment_confirmed',
          order_id: order.id,
          paid_at: order.paid_at,
          total_amount: order.total_amount,
        });
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      try {
        await this.scheduleAutoCloseIfFullyPaid(order.table_session_id);
      } catch (error) {
        console.error('❌ Error closing paid session:', error);
      }

      res.status(200).json({
        success: true,
        message: 'Xác nhận thanh toán thành công',
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
