/**
 * Table Controller - Presentation Layer
 */

import { Request, Response, NextFunction } from 'express';
import { TableRepository } from '../../infrastructure/database/repositories/TableRepository';
import { NotFoundError } from '../../application/errors/AppError';
import { TableStatus, TableSessionCustomerCartDraft } from '../../domain/entities/Table';
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
   * GET /api/v1/tables/session/:sessionId/cart-draft
   * Giỏ nháp đồng bộ server (khôi phục sau khi xóa cache nếu cùng phiên).
   */
  getCartDraft = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = await this.tableRepository.findSessionById(sessionId);
      if (!session) {
        throw new NotFoundError('Phiên không tồn tại');
      }
      if (!session.is_active) {
        res.status(200).json({
          success: true,
          data: null,
          inactive: true,
        });
        return;
      }
      const raw = session.customer_cart_draft as TableSessionCustomerCartDraft | undefined;
      const normalized = this.normalizeCartDraft(raw);
      res.status(200).json({
        success: true,
        data: normalized,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/tables/session/:sessionId/cart-draft
   */
  putCartDraft = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = await this.tableRepository.findSessionById(sessionId);
      if (!session) {
        throw new NotFoundError('Phiên không tồn tại');
      }
      if (!session.is_active) {
        res.status(409).json({
          success: false,
          message: 'Phiên đã kết thúc, không thể lưu giỏ nháp',
        });
        return;
      }

      const bodyItems = req.body?.items;
      const items = Array.isArray(bodyItems) ? bodyItems : [];
      if (items.length > 120) {
        res.status(400).json({ success: false, message: 'Giỏ vượt quá giới hạn' });
        return;
      }

      const sanitized = items.map((it: Record<string, unknown>) => ({
        id: String(it.id ?? '').slice(0, 160),
        name: String(it.name ?? 'Món').slice(0, 240),
        price: Number(it.price) || 0,
        priceDisplay: String(it.priceDisplay ?? '').slice(0, 40),
        quantity: Math.min(999, Math.max(1, Math.floor(Number(it.quantity) || 1))),
        note: it.note != null ? String(it.note).slice(0, 600) : undefined,
        options: it.options != null ? String(it.options).slice(0, 600) : undefined,
        category: it.category != null ? String(it.category).slice(0, 100) : undefined,
        image_url: typeof it.image_url === 'string' ? it.image_url.slice(0, 2500) : undefined,
      }));

      const updated_at = Number(req.body?.updated_at) || Date.now();
      const draft: TableSessionCustomerCartDraft = { items: sanitized, updated_at };
      await this.tableRepository.updateSessionCustomerDraft(sessionId, draft);

      res.status(200).json({
        success: true,
        message: 'Đã lưu giỏ nháp',
      });
    } catch (error) {
      next(error);
    }
  };

  private normalizeCartDraft(
    raw: TableSessionCustomerCartDraft | Record<string, unknown> | undefined | null
  ): TableSessionCustomerCartDraft | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const r = raw as Record<string, unknown>;
    let u = r.updated_at as number | { toMillis?: () => number; seconds?: number } | undefined;
    let ms = 0;
    if (u != null && typeof u === 'object' && typeof (u as { toMillis?: () => number }).toMillis === 'function') {
      ms = (u as { toMillis: () => number }).toMillis();
    } else if (u != null && typeof u === 'object' && typeof (u as { seconds?: number }).seconds === 'number') {
      ms = (u as { seconds: number }).seconds * 1000;
    } else {
      ms = Number(u) || 0;
    }
    const arr = Array.isArray(r.items) ? r.items : [];
    return {
      items: arr as TableSessionCustomerCartDraft['items'],
      updated_at: ms,
    };
  }

  /**
   * POST /api/v1/tables/:id/session
   */
  createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { customer_count } = req.body;

      const existing = await this.tableRepository.findActiveSessionByTableId(id);
      if (existing) {
        await this.tableRepository.updateStatus(id, TableStatus.OCCUPIED);
        this.socketManager.notifyTableUpdated(id);
        res.status(200).json({
          success: true,
          message: 'Đã có phiên đang hoạt động cho bàn này',
          data: existing,
          reused: true,
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
