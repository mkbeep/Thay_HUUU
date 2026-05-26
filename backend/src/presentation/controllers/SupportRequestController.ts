/**
 * Support Request Controller - Presentation Layer
 */

import { Request, Response, NextFunction } from 'express';
import { SupportRequestRepository } from '../../infrastructure/database/repositories/SupportRequestRepository';
import { NotificationService } from '../../application/services/NotificationService';
import { NotificationRepository } from '../../infrastructure/database/repositories/NotificationRepository';
import { UserRepository } from '../../infrastructure/database/repositories/UserRepository';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';
import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { NotificationType, NotificationPriority } from '../../domain/entities/Notification';
import {
  SupportRequestStatus,
  SupportRequestPriority,
  SupportRequestType,
} from '../../domain/entities/SupportRequest';

export class SupportRequestController {
  private supportRequestRepository: SupportRequestRepository;
  private notificationService: NotificationService;
  private readonly operationRoles = ['staff', 'waiter', 'manager', 'admin', 'chef', 'cashier'] as const;
  private readonly tableRepository = new TableRepository();

  constructor() {
    this.supportRequestRepository = new SupportRequestRepository();
    const notificationRepository = new NotificationRepository();
    const userRepository = new UserRepository();
    this.notificationService = new NotificationService(notificationRepository, userRepository);
  }

  /**
   * POST /api/v1/support-requests
   * Tạo yêu cầu hỗ trợ mới từ khách hàng
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { table_id, table_number, table_session_id, type, priority, note } = req.body;

      // Validate required fields
      if (!table_id || !table_number || !type) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: table_id, table_number, type',
        });
        return;
      }

      if (!Object.values(SupportRequestType).includes(type as SupportRequestType)) {
        res.status(400).json({
          success: false,
          message: `Unsupported support request type: ${type}`,
        });
        return;
      }

      // Create support request
      const supportRequest = await this.supportRequestRepository.create({
        table_id,
        table_number,
        table_session_id,
        type,
        priority: priority || SupportRequestPriority.NORMAL,
        note,
      });

      const notifyPayload = {
        type: NotificationType.STAFF_CALL,
        title: `🔔 Yêu cầu từ bàn ${table_number}`,
        message: this.getRequestMessage(type),
        data: {
          support_request_id: supportRequest.id,
          table_id,
          table_number,
          table_session_id,
          type,
        },
        priority: this.mapPriority(supportRequest.priority),
      };
      await Promise.all(
        this.operationRoles.map((role) =>
          this.notificationService.sendToRole(role, notifyPayload)
        )
      );

      const socketManager = SocketManager.getInstance();
      socketManager.notifySupportRequestCreated({
        ...supportRequest,
        title: notifyPayload.title,
        message: notifyPayload.message,
        priority: supportRequest.priority,
      });
      socketManager.notifyNewNotification({
        id: supportRequest.id,
        ...notifyPayload,
        created_at: new Date(),
        is_read: false,
      });

      res.status(201).json({
        success: true,
        message: 'Support request created successfully',
        data: supportRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/support-requests
   * Lấy danh sách yêu cầu hỗ trợ (cho admin/staff)
   */
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, table_id, limit } = req.query;

      const supportRequests = await this.supportRequestRepository.findAll({
        status: status as SupportRequestStatus,
        table_id: table_id as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      const pendingCount = await this.supportRequestRepository.countByStatus(
        SupportRequestStatus.PENDING
      );

      res.status(200).json({
        success: true,
        data: supportRequests,
        pending_count: pendingCount,
        total: supportRequests.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/support-requests/pending
   * Lấy danh sách yêu cầu đang chờ xử lý
   */
  getPending = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const supportRequests = await this.supportRequestRepository.findPending();

      res.status(200).json({
        success: true,
        data: supportRequests,
        total: supportRequests.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/support-requests/:id
   * Lấy chi tiết yêu cầu hỗ trợ
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const supportRequest = await this.supportRequestRepository.findById(id);

      if (!supportRequest) {
        res.status(404).json({
          success: false,
          message: 'Support request not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: supportRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/support-requests/:id
   * Cập nhật trạng thái yêu cầu hỗ trợ (staff/admin)
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, assigned_staff_id, note } = req.body;

      const supportRequest = await this.supportRequestRepository.findById(id);

      if (!supportRequest) {
        res.status(404).json({
          success: false,
          message: 'Support request not found',
        });
        return;
      }

      const updatedRequest = await this.supportRequestRepository.update(id, {
        status,
        assigned_staff_id,
        note,
      });

      try {
        const socketManager = SocketManager.getInstance();
        socketManager.notifySupportRequestUpdated(updatedRequest as unknown as Record<string, unknown>);

        let tableSessionId = updatedRequest.table_session_id;
        if (!tableSessionId && updatedRequest.table_id) {
          const activeSession = await this.tableRepository.findActiveSessionByTableId(
            updatedRequest.table_id
          );
          tableSessionId = activeSession?.id;
        }
        if (tableSessionId) {
          socketManager.emitToTable(tableSessionId, 'support:request_updated', updatedRequest);
        }
      } catch (error) {
        console.error('WebSocket emit error (support:request_updated):', error);
      }

      res.status(200).json({
        success: true,
        message: 'Support request updated successfully',
        data: updatedRequest,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/support-requests/:id
   * Xóa yêu cầu hỗ trợ
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const supportRequest = await this.supportRequestRepository.findById(id);

      if (!supportRequest) {
        res.status(404).json({
          success: false,
          message: 'Support request not found',
        });
        return;
      }

      await this.supportRequestRepository.delete(id);

      res.status(200).json({
        success: true,
        message: 'Support request deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Helper: Map request type to message
   */
  private getRequestMessage(type: string): string {
    const messages: Record<string, string> = {
      'call-staff': 'Khách yêu cầu gọi nhân viên',
      'add-water': 'Khách yêu cầu thêm nước',
      'add-tissue': 'Khách yêu cầu thêm khăn giấy',
      'add-utensils': 'Khách yêu cầu thêm đồ ăn kèm',
      'change-gas': 'Khách yêu cầu thay bình gas',
      'clean-table': 'Khách yêu cầu dọn bàn',
      'ask-question': 'Khách có câu hỏi về món ăn',
      'report-issue': 'Khách báo vấn đề',
    };
    return messages[type] || 'Khách có yêu cầu hỗ trợ';
  }

  /**
   * Helper: Map support priority to notification priority
   */
  private mapPriority(priority: SupportRequestPriority): NotificationPriority {
    const mapping: Record<SupportRequestPriority, NotificationPriority> = {
      [SupportRequestPriority.LOW]: NotificationPriority.LOW,
      [SupportRequestPriority.NORMAL]: NotificationPriority.NORMAL,
      [SupportRequestPriority.HIGH]: NotificationPriority.HIGH,
      [SupportRequestPriority.URGENT]: NotificationPriority.URGENT,
    };
    return mapping[priority];
  }
}
