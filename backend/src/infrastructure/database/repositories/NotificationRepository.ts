/**
 * Notification Repository Implementation - Infrastructure Layer
 */

import { db } from '../../config/firebase.config';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository';
import { Notification, NotificationType } from '../../../domain/entities/Notification';

export class NotificationRepository implements INotificationRepository {
  private readonly collection = db.collection('notification');
  private toMillis(value: any): number {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    if (typeof value.toDate === 'function') return value.toDate().getTime();
    if (typeof value._seconds === 'number') {
      return (value._seconds * 1000) + Math.floor((value._nanoseconds || 0) / 1_000_000);
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Notification;
  }

  async findByUserId(
    userId: string,
    filters?: {
      is_read?: boolean;
      type?: NotificationType;
      limit?: number;
    }
  ): Promise<Notification[]> {
    let query: FirebaseFirestore.Query = this.collection.where('user_id', '==', userId);

    if (filters?.is_read !== undefined) {
      query = query.where('is_read', '==', filters.is_read);
    }

    // Không dùng orderBy trên Firestore query để tránh yêu cầu composite index
    // Sẽ sort/limit ở memory.

    const snapshot = await query.get();
    let notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));

    if (filters?.type) {
      notifications = notifications.filter((n) => n.type === filters.type);
    }

    notifications.sort((a, b) => this.toMillis(b.created_at) - this.toMillis(a.created_at));

    if (filters?.limit && filters.limit > 0) {
      notifications = notifications.slice(0, filters.limit);
    }

    return notifications;
  }

  async create(notificationData: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const data = {
      ...notificationData,
      created_at: new Date(),
    };

    const docRef = await this.collection.add(data);
    return { id: docRef.id, ...data } as Notification;
  }

  async markAsRead(id: string): Promise<void> {
    await this.collection.doc(id).update({
      is_read: true,
      read_at: new Date(),
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const snapshot = await this.collection
      .where('user_id', '==', userId)
      .where('is_read', '==', false)
      .get();

    const batch = db.batch();
    const now = new Date();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        is_read: true,
        read_at: now,
      });
    });

    await batch.commit();
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async deleteExpired(): Promise<void> {
    const now = new Date();
    const snapshot = await this.collection
      .where('expires_at', '<=', now)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  async countUnread(userId: string): Promise<number> {
    const snapshot = await this.collection
      .where('user_id', '==', userId)
      .where('is_read', '==', false)
      .get();

    return snapshot.size;
  }
}
