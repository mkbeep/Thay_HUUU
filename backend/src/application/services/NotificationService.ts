/**
 * Notification Service - Application Layer
 * Xử lý logic gửi notification qua Firebase Cloud Messaging
 */

import { firebaseAdmin } from '../../infrastructure/config/firebase.config';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { NotificationType, NotificationPriority } from '../../domain/entities/Notification';

export interface SendNotificationDTO {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
}

export class NotificationService {
  constructor(
    private notificationRepository: INotificationRepository,
    private userRepository: IUserRepository
  ) {}

  /**
   * Gửi notification cho một user
   */
  async sendToUser(dto: SendNotificationDTO): Promise<void> {
    // 1. Lưu notification vào database
    const notification = await this.notificationRepository.create({
      user_id: dto.user_id,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      data: dto.data,
      priority: dto.priority || NotificationPriority.NORMAL,
      is_read: false,
    });

    try {
      SocketManager.getInstance().notifyNewNotification(notification);
    } catch (err) {
      console.warn('notifyNewNotification (socket) skipped:', err);
    }

    // 2. Lấy FCM token của user
    const user = await this.userRepository.findById(dto.user_id);
    if (!user?.fcm_token) {
      return;
    }

    // 3. Gửi push notification qua FCM
    try {
      await firebaseAdmin.messaging().send({
        token: user.fcm_token,
        notification: {
          title: dto.title,
          body: dto.message,
        },
        data: {
          notification_id: notification.id,
          type: dto.type,
          ...dto.data,
        },
        android: {
          priority: this.mapPriorityToAndroid(dto.priority),
          notification: {
            sound: 'default',
            channelId: 'restaurant_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: await this.notificationRepository.countUnread(dto.user_id),
            },
          },
        },
      });

      console.log(`✅ Notification sent to user ${dto.user_id}`);
    } catch (error) {
      console.error('❌ Error sending FCM notification:', error);
      // Không throw error để không ảnh hưởng đến flow chính
    }
  }

  /**
   * Gửi notification cho nhiều users
   */
  async sendToMultipleUsers(
    userIds: string[],
    dto: Omit<SendNotificationDTO, 'user_id'>
  ): Promise<void> {
    await Promise.all(
      userIds.map(userId =>
        this.sendToUser({ ...dto, user_id: userId })
      )
    );
  }

  /**
   * Gửi notification cho tất cả users có role cụ thể
   */
  async sendToRole(
    role: string,
    dto: Omit<SendNotificationDTO, 'user_id'>
  ): Promise<void> {
    const users = await this.userRepository.findAll({ role, is_active: true });
    const userIds = users.map(u => u.id);
    await this.sendToMultipleUsers(userIds, dto);
  }

  /**
   * Gửi cho nhiều role nhưng mỗi user chỉ nhận một bản (tránh trùng khi user có nhiều vai trò).
   * Log cảnh báo nếu không có người nhận (thường do thiếu bản ghi user_role trong DB).
   */
  async sendToRolesDeduped(
    roles: string[],
    dto: Omit<SendNotificationDTO, 'user_id'>
  ): Promise<void> {
    const seen = new Set<string>();
    for (const role of roles) {
      const users = await this.userRepository.findAll({ role, is_active: true });
      for (const u of users) {
        if (u?.id) seen.add(u.id);
      }
    }
    if (seen.size === 0) {
      console.warn(
        `[NotificationService] Không tìm thấy user active cho các role: ${roles.join(', ')} — bỏ qua lưu thông báo`
      );
      return;
    }
    await this.sendToMultipleUsers([...seen], dto);
  }

  /**
   * Gửi notification broadcast (tất cả users)
   */
  async sendBroadcast(dto: Omit<SendNotificationDTO, 'user_id'>): Promise<void> {
    const users = await this.userRepository.findAll({ is_active: true });
    const userIds = users.map(u => u.id);
    await this.sendToMultipleUsers(userIds, dto);
  }

  private mapPriorityToAndroid(priority?: NotificationPriority): 'high' | 'normal' {
    if (priority === NotificationPriority.HIGH || priority === NotificationPriority.URGENT) {
      return 'high';
    }
    return 'normal';
  }
}
