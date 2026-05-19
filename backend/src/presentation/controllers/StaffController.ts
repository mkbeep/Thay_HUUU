/**
 * Staff Controller - Presentation Layer
 */

import { Request, Response, NextFunction } from 'express';
import { StaffRepository } from '../../infrastructure/database/repositories/StaffRepository';
import {
  CreateStaffUseCase,
  GetActiveStaffCountUseCase,
  GetRolesUseCase,
  GetStaffDirectoryUseCase,
  UpdateStaffRoleUseCase,
} from '../../application/use-cases/staff/StaffUseCases';

export class StaffController {
  private getActiveStaffCountUseCase: GetActiveStaffCountUseCase;
  private getStaffDirectoryUseCase: GetStaffDirectoryUseCase;
  private getRolesUseCase: GetRolesUseCase;
  private createStaffUseCase: CreateStaffUseCase;
  private updateStaffRoleUseCase: UpdateStaffRoleUseCase;

  constructor() {
    const staffRepository = new StaffRepository();
    this.getActiveStaffCountUseCase = new GetActiveStaffCountUseCase(staffRepository);
    this.getStaffDirectoryUseCase = new GetStaffDirectoryUseCase(staffRepository);
    this.getRolesUseCase = new GetRolesUseCase(staffRepository);
    this.createStaffUseCase = new CreateStaffUseCase(staffRepository);
    this.updateStaffRoleUseCase = new UpdateStaffRoleUseCase(staffRepository);
  }

  getActiveCount = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await this.getActiveStaffCountUseCase.execute();
      res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  };

  getDirectory = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const staff = await this.getStaffDirectoryUseCase.execute();
      res.status(200).json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  };

  getRoles = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await this.getRolesUseCase.execute();
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  };

  createStaff = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assignedBy = req.user?.userId || 'system';
      const staff = await this.createStaffUseCase.execute(req.body, assignedBy);

      res.status(201).json({
        success: true,
        message: 'Đã thêm nhân viên thành công',
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { role_id } = req.body;
      const assignedBy = req.user?.userId || 'system';

      await this.updateStaffRoleUseCase.execute(id, role_id, assignedBy);

      res.status(200).json({
        success: true,
        message: 'Đã cập nhật vai trò thành công',
      });
    } catch (error) {
      next(error);
    }
  };
}
