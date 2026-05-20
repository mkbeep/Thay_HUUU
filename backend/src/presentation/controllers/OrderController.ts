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

export class OrderController {
  private orderRepository: OrderRepository;
  private notificationService: NotificationService;
  private readonly operationRoles = ['staff', 'manager', 'admin', 'chef'] as const;

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

  private emitAdminNotification(payload: {
    title: string;
    message: string;
    data?: Record<string, any>;
    type?: NotificationType;
    priority?: NotificationPriority;
  }) {
    try {
      const socketManager = SocketManager.getInstance();
      socketManager.notifyNewNotification({
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        type: payload.type,
        priority: payload.priority || NotificationPriority.NORMAL,
        is_read: false,
        created_at: new Date(),
      });
    } catch (error) {
      console.error('WebSocket notification emit error:', error);
    }
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
   * Public endpoint cho app khÃ¡ch Ä‘á»“ng bá»™ tráº¡ng thÃ¡i Ä‘Æ¡n theo bÃ n
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
        throw new NotFoundError('ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i');
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

      // Gá»­i notification cho toÃ n bá»™ bá»™ pháº­n váº­n hÃ nh (staff/manager/admin)
      await this.notifyOperationRoles({
        type: NotificationType.ORDER_CREATED,
        title: 'ÄÆ¡n hÃ ng má»›i',
        message: `ÄÆ¡n hÃ ng ${orderNumber} vá»«a Ä‘Æ°á»£c táº¡o`,
        data: { order_id: order.id },
        priority: NotificationPriority.HIGH,
      });

      // ðŸ”¥ Emit WebSocket event
      try {
        const socketManager = SocketManager.getInstance();
        socketManager.notifyOrderCreated(order);
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      this.emitAdminNotification({
        type: NotificationType.ORDER_CREATED,
        title: 'ÄÆ¡n hÃ ng má»›i',
        message: `ÄÆ¡n hÃ ng ${orderNumber} vá»«a Ä‘Æ°á»£c táº¡o`,
        data: { order_id: order.id, table_number: order.table_number },
        priority: NotificationPriority.HIGH,
      });

      res.status(201).json({
        success: true,
        message: 'Táº¡o Ä‘Æ¡n hÃ ng thÃ nh cÃ´ng',
        data: order,
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

      // Gá»­i notification cho customer
      if (order.customer_id) {
        await this.notificationService.sendToUser({
          user_id: order.customer_id,
          type: NotificationType.ORDER_UPDATED,
          title: 'Cáº­p nháº­t Ä‘Æ¡n hÃ ng',
          message: `ÄÆ¡n hÃ ng ${order.order_number} Ä‘Ã£ chuyá»ƒn sang tráº¡ng thÃ¡i ${status}`,
          data: { order_id: order.id, status },
          priority: NotificationPriority.NORMAL,
        });
      }

      // ðŸ”¥ Emit WebSocket event
      try {
        const socketManager = SocketManager.getInstance();
        socketManager.notifyOrderStatusChanged(order.id, status, order);
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      res.status(200).json({
        success: true,
        message: 'Cáº­p nháº­t tráº¡ng thÃ¡i thÃ nh cÃ´ng',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/orders/:id/request-payment
   * KhÃ¡ch gá»­i yÃªu cáº§u thanh toÃ¡n
   */
  requestPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const paymentMethod = req.body.payment_method || 'qr';
      const order = await this.orderRepository.requestPayment(id, paymentMethod);

      await this.notifyOperationRoles({
        type: NotificationType.PAYMENT_REQUEST,
        title: 'YÃªu cáº§u thanh toÃ¡n',
        message: `ÄÆ¡n ${order.order_number} yÃªu cáº§u thanh toÃ¡n báº±ng ${paymentMethod}`,
        data: { order_id: order.id, payment_method: paymentMethod },
        priority: NotificationPriority.HIGH,
      });

      try {
        const socketManager = SocketManager.getInstance();
        socketManager.notifyOrderUpdated(order);
      } catch (error) {
        console.error('WebSocket emit error (request-payment):', error);
      }

      this.emitAdminNotification({
        type: NotificationType.PAYMENT_REQUEST,
        title: 'Yêu cầu thanh toán',
        message: `Đơn ${order.order_number} yêu cầu thanh toán bằng ${paymentMethod}`,
        data: { order_id: order.id, payment_method: paymentMethod, table_number: order.table_number },
        priority: NotificationPriority.HIGH,
      });

      res.status(200).json({
        success: true,
        message: 'ÄÃ£ gá»­i yÃªu cáº§u thanh toÃ¡n',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/orders/:id/cancel
   * KhÃ¡ch há»§y Ä‘Æ¡n (chá»‰ pending / confirmed). body: { table_session_id?: string }
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
          throw new NotFoundError('ÄÆ¡n hÃ ng khÃ´ng tá»“n táº¡i');
        }
        if (e?.message === 'TABLE_MISMATCH') {
          throw new AppError('KhÃ´ng khá»›p thÃ´ng tin bÃ n', 403);
        }
        if (e?.message === 'CANCEL_NOT_ALLOWED') {
          throw new AppError(
            'Chá»‰ cÃ³ thá»ƒ há»§y khi Ä‘Æ¡n á»Ÿ tráº¡ng thÃ¡i "má»›i" hoáº·c "Ä‘Ã£ nháº­n", trÆ°á»›c khi báº¿p báº¯t Ä‘áº§u náº¥u.',
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

      res.status(200).json({
        success: true,
        message: 'ÄÃ£ há»§y Ä‘Æ¡n hÃ ng',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/orders/:id/confirm-payment
   * Thu ngÃ¢n/admin xÃ¡c nháº­n Ä‘Ã£ nháº­n tiá»n
   */
  confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const order = await this.orderRepository.confirmPayment(id);

      // ðŸ”¥ Emit WebSocket event trÆ°á»›c khi xÃ³a
      try {
        const socketManager = SocketManager.getInstance();
        socketManager.notifyOrderUpdated(order);
      } catch (error) {
        console.error('WebSocket emit error:', error);
      }

      // âœ… Kiá»ƒm tra xem cÃ²n order nÃ o chÆ°a thanh toÃ¡n cá»§a session nÃ y khÃ´ng
      if (order.table_session_id) {
        const remainingOrders = await this.orderRepository.findByTableSession(order.table_session_id);
        const unpaidOrders = remainingOrders.filter(o => 
          o.id !== order.id && o.payment_status !== 'paid'
        );

        console.log(`ðŸ“Š Session ${order.table_session_id}: ${unpaidOrders.length} unpaid orders remaining`);

        // Náº¿u khÃ´ng cÃ²n order nÃ o chÆ°a thanh toÃ¡n â†’ Cáº­p nháº­t bÃ n vá» available
        if (unpaidOrders.length === 0) {
          try {
            const tableRepository = new (require('../../infrastructure/database/repositories/TableRepository').TableRepository)();
            const session = await tableRepository.findSessionById(order.table_session_id);
            
            if (session && session.is_active) {
              // End session
              await tableRepository.endSession(order.table_session_id);
              
              // Update table status to available
              await tableRepository.updateStatus(session.table_id, 'available');
              
              console.log(`âœ… Table ${session.table_id} set to available - all orders paid`);
              
              // Notify table status changed
              const socketManager = SocketManager.getInstance();
              socketManager.notifyTableUpdated(session.table_id);
            }
          } catch (error) {
            console.error('âŒ Error updating table status:', error);
          }
        }
      }

      // ðŸ—‘ï¸ XÃ“A ORDER ÄÃƒ THANH TOÃN
      await this.orderRepository.delete(id);
      console.log(`ðŸ—‘ï¸ Deleted paid order: ${id}`);

      res.status(200).json({
        success: true,
        message: 'XÃ¡c nháº­n thanh toÃ¡n vÃ  xÃ³a Ä‘Æ¡n hÃ ng thÃ nh cÃ´ng',
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
        message: 'XÃ³a Ä‘Æ¡n hÃ ng thÃ nh cÃ´ng',
      });
    } catch (error) {
      next(error);
    }
  };
}
