/**
 * Notification Repository Interface - Domain Layer
 */

import { Notification, NotificationType } from '../entities/Notification';

export interface INotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, filters?: {
    is_read?: boolean;
    type?: NotificationType;
    limit?: number;
  }): Promise<Notification[]>;
  create(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByOrderId(orderId: string, type?: NotificationType): Promise<number>;
  deleteExpired(): Promise<void>;
  countUnread(userId: string): Promise<number>;
}
