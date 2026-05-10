/**
 * Support Request Repository Interface - Domain Layer
 */

import { SupportRequest, CreateSupportRequestDTO, UpdateSupportRequestDTO, SupportRequestStatus } from '../entities/SupportRequest';

export interface ISupportRequestRepository {
  create(dto: CreateSupportRequestDTO): Promise<SupportRequest>;
  findById(id: string): Promise<SupportRequest | null>;
  findAll(filters?: {
    status?: SupportRequestStatus;
    table_id?: string;
    limit?: number;
  }): Promise<SupportRequest[]>;
  findPending(): Promise<SupportRequest[]>;
  update(id: string, dto: UpdateSupportRequestDTO): Promise<SupportRequest>;
  delete(id: string): Promise<void>;
  countByStatus(status: SupportRequestStatus): Promise<number>;
}
