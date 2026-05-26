/**
 * Notification Service - Application Layer
 * Xử lý logic gửi notification qua Firebase Cloud Messaging
 */

import { firebaseAdmin } from '../../infrastructure/config/firebase.config';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { NotificationType, NotificationPriority } from '../../domain/entities/Notification';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';

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
      SocketManager.getInstance().notifyNewNotification({
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        is_read: notification.is_read,
        created_at: notification.created_at,
      });
    } catch {
      /* socket optional */
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
