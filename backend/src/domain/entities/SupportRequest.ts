/**
 * Support Request Entity - Domain Layer
 */

export enum SupportRequestType {
  CALL_STAFF = 'call-staff',
  ADD_WATER = 'add-water',
  ADD_TISSUE = 'add-tissue',
  ADD_UTENSILS = 'add-utensils',
  CHANGE_GAS = 'change-gas',
  CLEAN_TABLE = 'clean-table',
  ASK_QUESTION = 'ask-question',
  REPORT_ISSUE = 'report-issue',
}

export enum SupportRequestStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum SupportRequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface SupportRequest {
  id: string;
  table_id: string;
  table_number: string;
  table_session_id?: string;
  type: SupportRequestType;
  status: SupportRequestStatus;
  priority: SupportRequestPriority;
  note?: string;
  assigned_staff_id?: string;
  created_at: Date;
  updated_at: Date;
  confirmed_at?: Date;
  completed_at?: Date;
}

export interface CreateSupportRequestDTO {
  table_id: string;
  table_number: string;
  table_session_id?: string;
  type: SupportRequestType;
  priority?: SupportRequestPriority;
  note?: string;
}

export interface UpdateSupportRequestDTO {
  status?: SupportRequestStatus;
  assigned_staff_id?: string;
  note?: string;
}
