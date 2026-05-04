/**
 * Notification Controller - Presentation Layer
 * Xử lý HTTP requests liên quan đến notifications
 */

import { Request, Response, NextFunction } from 'express';
import { NotificationRepository } from '../../infrastructure/database/repositories/NotificationRepository';
import { UserRepository } from '../../infrastructure/database/repositories/UserRepository';
import { NotificationService } from '../../application/services/NotificationService';

export class NotificationController {
  private notificationRepository: NotificationRepository;
  private notificationService: NotificationService;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    const userRepository = new UserRepository();
    this.notificationService = new NotificationService(
      this.notificationRepository,
      userRepository
    );
  }

  /**
   * GET /api/v1/notifications
   * Lấy danh sách notifications của user hiện tại
   */
  getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { is_read, type, limit } = req.query;

      const notifications = await this.notificationRepository.findByUserId(userId, {
        is_read: is_read === 'true' ? true : is_read === 'false' ? false : undefined,
        type: type as any,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      const unreadCount = await this.notificationRepository.countUnread(userId);

      res.status(200).json({
        success: true,
        data: notifications,
        unread_count: unreadCount,
        total: notifications.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/notifications/unread-count
   * Đếm số notification chưa đọc
   */
  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const count = await this.notificationRepository.countUnread(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/notifications/:id/read
   * Đánh dấu notification đã đọc
   */
  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.notificationRepository.markAsRead(id);

      res.status(200).json({
        success: true,
        message: 'Đã đánh dấu đã đọc',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/notifications/read-all
   * Đánh dấu tất cả notifications đã đọc
   */
  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      await this.notificationRepository.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'Đã đánh dấu tất cả đã đọc',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/notifications/send
   * Gửi notification (Admin only)
   */
  sendNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id, type, title, message, data, priority } = req.body;

      await this.notificationService.sendToUser({
        user_id,
        type,
        title,
        message,
        data,
        priority,
      });

      res.status(200).json({
        success: true,
        message: 'Gửi notification thành công',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/notifications/broadcast
   * Gửi notification broadcast (Admin only)
   */
  sendBroadcast = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, title, message, data, priority } = req.body;

      await this.notificationService.sendBroadcast({
        type,
        title,
        message,
        data,
        priority,
      });

      res.status(200).json({
        success: true,
        message: 'Gửi broadcast thành công',
      });
    } catch (error) {
      next(error);
    }
  };
}
