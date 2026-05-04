/**
 * Notification Entity - Domain Layer
 */

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated',
  ORDER_READY = 'order_ready',
  ORDER_COMPLETED = 'order_completed',
  TABLE_REQUEST = 'table_request',
  STAFF_CALL = 'staff_call',
  PAYMENT_REQUEST = 'payment_request',
  SYSTEM_ALERT = 'system_alert',
  PROMOTION = 'promotion'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
  expires_at?: Date;
}

export interface NotificationPreference {
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  notification_types: NotificationType[];
  updated_at: Date;
}
