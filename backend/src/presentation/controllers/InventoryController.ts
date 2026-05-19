/**
 * Inventory (Material) Controller - Presentation Layer
 */

import { Request, Response, NextFunction } from 'express';
import { MaterialRepository } from '../../infrastructure/database/repositories/MaterialRepository';
import {
  AddMaterialExportUseCase,
  AddMaterialImportUseCase,
  CreateMaterialUseCase,
  GetMaterialAlertsUseCase,
  GetMaterialByIdUseCase,
  GetMaterialHistoryUseCase,
  GetMaterialKpiUseCase,
  GetMaterialsUseCase,
} from '../../application/use-cases/material/MaterialUseCases';

export class InventoryController {
  private getKpiUseCase: GetMaterialKpiUseCase;
  private getMaterialsUseCase: GetMaterialsUseCase;
  private getAlertsUseCase: GetMaterialAlertsUseCase;
  private getByIdUseCase: GetMaterialByIdUseCase;
  private getHistoryUseCase: GetMaterialHistoryUseCase;
  private createMaterialUseCase: CreateMaterialUseCase;
  private addImportUseCase: AddMaterialImportUseCase;
  private addExportUseCase: AddMaterialExportUseCase;

  constructor() {
    const materialRepository = new MaterialRepository();
    this.getKpiUseCase = new GetMaterialKpiUseCase(materialRepository);
    this.getMaterialsUseCase = new GetMaterialsUseCase(materialRepository);
    this.getAlertsUseCase = new GetMaterialAlertsUseCase(materialRepository);
    this.getByIdUseCase = new GetMaterialByIdUseCase(materialRepository);
    this.getHistoryUseCase = new GetMaterialHistoryUseCase(materialRepository);
    this.createMaterialUseCase = new CreateMaterialUseCase(materialRepository);
    this.addImportUseCase = new AddMaterialImportUseCase(materialRepository);
    this.addExportUseCase = new AddMaterialExportUseCase(materialRepository);
  }

  /**
   * GET /api/v1/inventory/stats
   */
  getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const kpi = await this.getKpiUseCase.execute();
      res.status(200).json({ success: true, data: kpi });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/inventory/alerts
   */
  getAlerts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.getAlertsUseCase.execute();
      res.status(200).json({
        success: true,
        data: items,
        total: items.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/inventory
   */
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, status, search } = req.query;

      const items = await this.getMaterialsUseCase.execute({
        category: category as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: items,
        total: items.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/inventory/:id
   */
  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.getByIdUseCase.execute(req.params.id);
      res.status(200).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/inventory/:id/history
   */
  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await this.getHistoryUseCase.execute(req.params.id);
      res.status(200).json({
        success: true,
        data: history,
        total: history.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/inventory
   * Tạo nguyên liệu mới kèm import đầu tiên
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.createMaterialUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        message: 'Tạo nguyên liệu thành công',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/inventory/:id/import
   */
  addImport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.addImportUseCase.execute(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Nhập hàng thành công',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/inventory/:id/export
   */
  addExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.addExportUseCase.execute(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Xuất hàng thành công',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };
}
