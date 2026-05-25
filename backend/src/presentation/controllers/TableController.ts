/**
 * Table Controller - Presentation Layer
 */

import { Request, Response, NextFunction } from 'express';
import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { NotFoundError } from '../../application/errors/AppError';
import { TableStatus } from '../../domain/entities/Table';
import { v4 as uuidv4 } from 'uuid';
import { attachCustomerMenuUrl } from '../../infrastructure/utils/tableResponse';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';

export class TableController {
  private tableRepository: TableRepository;
  private socketManager: SocketManager;

  constructor(socketManager: SocketManager) {
    this.tableRepository = new TableRepository();
    this.socketManager = socketManager;
  }

  /**
   * GET /api/v1/tables
   */
  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Note: status and capacity filters are not yet implemented in repository
      const tables = await this.tableRepository.findAllWithSessions();

      res.status(200).json({
        success: true,
        data: tables.map((t) => attachCustomerMenuUrl(t)),
        total: tables.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/tables/:id
   */
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const table = await this.tableRepository.findByIdWithSession(id);

      if (!table) {
        throw new NotFoundError('Bàn không tồn tại');
      }

      res.status(200).json({
        success: true,
        data: attachCustomerMenuUrl(table),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/tables/by-number/:number
   */
  getByNumber = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { number } = req.params;
      const tableNumber = number; // Keep as string (T01, G01, V01, etc.)

      const table = await this.tableRepository.findByTableNumberWithSession(tableNumber);

      if (!table) {
        throw new NotFoundError(`Không tìm thấy bàn ${tableNumber}`);
      }

      res.status(200).json({
        success: true,
        data: attachCustomerMenuUrl(table),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/tables
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const table = await this.tableRepository.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Tạo bàn thành công',
        data: attachCustomerMenuUrl(table),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/tables/:id
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const table = await this.tableRepository.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Cập nhật bàn thành công',
        data: attachCustomerMenuUrl(table),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/tables/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.tableRepository.delete(id);

      res.status(200).json({
        success: true,
        message: 'Xóa bàn thành công',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/tables/:id/status
   */
  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const table = await this.tableRepository.updateStatus(id, status);

      // ✅ EMIT WEBSOCKET EVENT ĐỂ ADMIN THẤY NGAY
      this.socketManager.notifyTableUpdated(id);

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: attachCustomerMenuUrl(table),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/tables/:id/session
   */
  createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { customer_count } = req.body;

      const existingSession = await this.tableRepository.findActiveSessionByTableId(id);
      if (existingSession) {
        await this.tableRepository.updateStatus(id, TableStatus.OCCUPIED);
        this.socketManager.notifyTableUpdated(id);

        res.status(200).json({
          success: true,
          message: 'Phiên bàn đang hoạt động',
          data: existingSession,
        });
        return;
      }

      // Generate session code
      const sessionCode = uuidv4().substring(0, 8).toUpperCase();

      const session = await this.tableRepository.createSession({
        table_id: id,
        session_code: sessionCode,
        customer_count,
        is_active: true,
        created_by: req.user?.userId,
      });

      // Update table status to occupied
      await this.tableRepository.updateStatus(id, TableStatus.OCCUPIED);

      // ✅ NOTIFY ADMIN VỀ TRẠNG THÁI BÀN MỚI
      this.socketManager.notifyTableUpdated(id);

      res.status(201).json({
        success: true,
        message: 'Tạo phiên bàn thành công',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/tables/session/:sessionId/end
   */
  endSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;

      const session = await this.tableRepository.endSession(sessionId);

      // Update table status to available
      await this.tableRepository.updateStatus(session.table_id, TableStatus.AVAILABLE);

      // ✅ NOTIFY ADMIN VỀ TRẠNG THÁI BÀN MỚI
      this.socketManager.notifyTableUpdated(session.table_id);

      res.status(200).json({
        success: true,
        message: 'Kết thúc phiên bàn thành công',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };
}
