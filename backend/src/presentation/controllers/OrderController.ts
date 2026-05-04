/**
 * Order Controller - Presentation Layer
 */

import { Request, Response, NextFunction } from 'express';
import { OrderRepository } from '../../infrastructure/database/repositories/OrderRepository';
import { NotFoundError } from '../../application/errors/AppError';
import { NotificationService } from '../../application/services/NotificationService';
import { NotificationRepository } from '../../infrastructure/database/repositories/NotificationRepository';
import { UserRepository } from '../../infrastructure/database/repositories/UserRepository';
import { NotificationType, NotificationPriority } from '../../domain/entities/Notification';

export class OrderController {
  private orderRepository: OrderRepository;
  private notificationService: NotificationService;

  constructor() {
    this.orderRepository = new OrderRepository();
    const notificationRepository = new NotificationRepository();
    const userRepository = new UserRepository();
    this.notificationService = new NotificationService(notificationRepository, userRepository);
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
      });

      // Gửi notification cho staff
      await this.notificationService.sendToRole('staff', {
        type: NotificationType.ORDER_CREATED,
        title: 'Đơn hàng mới',
        message: `Đơn hàng ${orderNumber} vừa được tạo`,
        data: { order_id: order.id },
        priority: NotificationPriority.HIGH,
      });

      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thành công',
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
