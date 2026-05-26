/**
 * Table Controller - Presentation Layer
 */

import { Request, Response, NextFunction } from 'express';
import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { NotFoundError } from '../../application/errors/AppError';
import { attachCustomerMenuUrl } from '../../infrastructure/utils/tableResponse';
import { enrichTablesWithSessionStats } from '../../infrastructure/utils/enrichTableSessions';
import { SocketManager } from '../../infrastructure/websocket/SocketManager';
import { SessionController } from './SessionController';
import { getSessionAutoCloseService } from '../../application/services/SessionAutoCloseService';

export class TableController {
  private tableRepository: TableRepository;
  private socketManager: SocketManager;
  private sessionController: SessionController;

  constructor(socketManager: SocketManager) {
    this.tableRepository = new TableRepository();
    this.socketManager = socketManager;
    this.sessionController = new SessionController(socketManager);
  }

  /**
   * GET /api/v1/tables
   */
  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Note: status and capacity filters are not yet implemented in repository
      const tables = await enrichTablesWithSessionStats(
        await this.tableRepository.findAllWithSessions()
      );

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
      const raw = await this.tableRepository.findByIdWithSession(id);

      if (!raw) {
        throw new NotFoundError('Bàn không tồn tại');
      }

      const [table] = await enrichTablesWithSessionStats([raw]);

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

      this.socketManager.notifyTableUpdated(id);
      this.socketManager.notifyTableDocumentChanged(id);

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
      const {
        customer_count = 1,
        session_token: clientToken,
        device_fingerprint: deviceFingerprint,
      } = req.body;

      const { session, created, conflict, minutesSinceActive } =
        await this.sessionController.resolveSessionForTable(
          id,
          customer_count,
          clientToken,
          deviceFingerprint
        );

      this.socketManager.notifyTableUpdated(id);
      this.socketManager.notifyTableDocumentChanged(id);

      if (conflict) {
        res.status(409).json({
          success: false,
          conflict: true,
          minutesSinceActive,
          message:
            'Bàn đang có khách khác. Nhân viên sẽ kiểm tra — vui lòng chờ hoặc liên hệ quầy.',
          data: session,
        });
        return;
      }

      res.status(created ? 201 : 200).json({
        success: true,
        message: created ? 'Tạo phiên bàn thành công' : 'Phiên bàn đang hoạt động',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  pingSession = (req: Request, res: Response, next: NextFunction) =>
    this.sessionController.ping(req, res, next);

  getSessionState = (req: Request, res: Response, next: NextFunction) =>
    this.sessionController.getState(req, res, next);

  forceResetTable = (req: Request, res: Response, next: NextFunction) =>
    this.sessionController.forceReset(req, res, next);

  /**
   * PATCH /api/v1/tables/session/:sessionId/end
   */
  endSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const existing = await this.tableRepository.findSessionById(sessionId);
      if (!existing) {
        throw new NotFoundError('Phiên không tồn tại');
      }

      await getSessionAutoCloseService().closeSessionNow(
        sessionId,
        existing.table_id,
        this.socketManager
      );

      const session = await this.tableRepository.findSessionById(sessionId);

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
