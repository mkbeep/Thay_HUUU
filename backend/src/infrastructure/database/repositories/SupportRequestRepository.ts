/**
 * Support Request Repository - Infrastructure Layer
 */

import { db } from '../../config/firebase.config';
import { ISupportRequestRepository } from '../../../domain/repositories/ISupportRequestRepository';
import {
  SupportRequest,
  CreateSupportRequestDTO,
  UpdateSupportRequestDTO,
  SupportRequestStatus,
  SupportRequestPriority,
} from '../../../domain/entities/SupportRequest';

export class SupportRequestRepository implements ISupportRequestRepository {
  private collection = db.collection('support_requests');

  async create(dto: CreateSupportRequestDTO): Promise<SupportRequest> {
    const now = new Date();
    const docRef = await this.collection.add({
      table_id: dto.table_id,
      table_number: dto.table_number,
      table_session_id: dto.table_session_id || '',
      type: dto.type,
      status: SupportRequestStatus.PENDING,
      priority: dto.priority || SupportRequestPriority.NORMAL,
      note: dto.note || '',
      created_at: now,
      updated_at: now,
    });

    const doc = await docRef.get();
    return this.mapToEntity(doc.id, doc.data()!);
  }

  async findById(id: string): Promise<SupportRequest | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return this.mapToEntity(doc.id, doc.data()!);
  }

  async findAll(filters?: {
    status?: SupportRequestStatus;
    table_id?: string;
    limit?: number;
  }): Promise<SupportRequest[]> {
    let query: any = this.collection.orderBy('created_at', 'desc');

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.table_id) {
      query = query.where('table_id', '==', filters.table_id);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => this.mapToEntity(doc.id, doc.data()));
  }

  async findPending(): Promise<SupportRequest[]> {
    const snapshot = await this.collection
      .where('status', '==', SupportRequestStatus.PENDING)
      .orderBy('created_at', 'desc')
      .get();

    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => this.mapToEntity(doc.id, doc.data()));
  }

  async update(id: string, dto: UpdateSupportRequestDTO): Promise<SupportRequest> {
    const updateData: any = {
      ...dto,
      updated_at: new Date(),
    };

    if (dto.status === SupportRequestStatus.CONFIRMED && !updateData.confirmed_at) {
      updateData.confirmed_at = new Date();
    }

    if (dto.status === SupportRequestStatus.COMPLETED && !updateData.completed_at) {
      updateData.completed_at = new Date();
    }

    await this.collection.doc(id).update(updateData);

    const doc = await this.collection.doc(id).get();
    return this.mapToEntity(doc.id, doc.data()!);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async countByStatus(status: SupportRequestStatus): Promise<number> {
    const snapshot = await this.collection
      .where('status', '==', status)
      .get();
    return snapshot.size;
  }

  private mapToEntity(id: string, data: any): SupportRequest {
    return {
      id,
      table_id: data.table_id,
      table_number: data.table_number,
      table_session_id: data.table_session_id,
      type: data.type,
      status: data.status,
      priority: data.priority,
      note: data.note,
      assigned_staff_id: data.assigned_staff_id,
      created_at: data.created_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
      confirmed_at: data.confirmed_at?.toDate(),
      completed_at: data.completed_at?.toDate(),
    };
  }
}
