/**
 * Material Use Cases - Application Layer
 */

import { AppError } from '../../errors/AppError';
import {
  AddExportDTO,
  AddImportDTO,
  CreateMaterialDTO,
  MaterialDTO,
  MaterialHistoryEntryDTO,
  MaterialKpiDTO,
} from '../../dto/MaterialDTO';
import { MaterialRepository } from '../../../infrastructure/database/repositories/MaterialRepository';

const VALID_CATEGORIES = [
  'Hải sản',
  'Thịt',
  'Rau củ',
  'Đồ uống',
  'Gia vị',
  'Sữa',
];

export class GetMaterialKpiUseCase {
  constructor(private materialRepository: MaterialRepository) {}

  async execute(): Promise<MaterialKpiDTO> {
    return this.materialRepository.getKpi();
  }
}

export class GetMaterialsUseCase {
  constructor(private materialRepository: MaterialRepository) {}

  async execute(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<MaterialDTO[]> {
    return this.materialRepository.findAll(filters);
  }
}

export class GetMaterialAlertsUseCase {
  constructor(private materialRepository: MaterialRepository) {}

  async execute(): Promise<MaterialDTO[]> {
    return this.materialRepository.findAlertItems();
  }
}

export class GetMaterialByIdUseCase {
  constructor(private materialRepository: MaterialRepository) {}

  async execute(id: string): Promise<MaterialDTO> {
    const material = await this.materialRepository.findById(id);
    if (!material) {
      throw new AppError('Nguyên liệu không tồn tại', 404);
    }
    return material;
  }
}

export class GetMaterialHistoryUseCase {
  constructor(private materialRepository: MaterialRepository) {}

  async execute(materialId: string): Promise<MaterialHistoryEntryDTO[]> {
    const material = await this.materialRepository.findById(materialId);
    if (!material) {
      throw new AppError('Nguyên liệu không tồn tại', 404);
    }
    return this.materialRepository.getHistory(materialId);
  }
}

export class CreateMaterialUseCase {
  constructor(private materialRepository: MaterialRepository) {}

  async execute(dto: CreateMaterialDTO): Promise<MaterialDTO> {
    if (!dto.name?.trim()) {
      throw new AppError('Tên nguyên liệu là bắt buộc', 400);
    }
    if (!VALID_CATEGORIES.includes(dto.category)) {
      throw new AppError('Danh mục không hợp lệ', 400);
    }
    if (Number(dto.minimum) < 0) {
      throw new AppError('Mức tối thiểu phải >= 0', 400);
    }
    if (!dto.import?.supplier?.trim()) {
      throw new AppError('Nhà cung cấp là bắt buộc', 400);
    }
    if (Number(dto.import.quantity) <= 0) {
      throw new AppError('Số lượng nhập phải lớn hơn 0', 400);
    }
    if (Number(dto.import.price) < 0) {
      throw new AppError('Giá nhập không hợp lệ', 400);
    }

    return this.materialRepository.createWithInitialImport(dto);
  }
}

export class AddMaterialImportUseCase {
  constructor(private materialRepository: MaterialRepository) {}

  async execute(materialId: string, dto: AddImportDTO): Promise<MaterialDTO> {
    if (!dto.supplier?.trim()) {
      throw new AppError('Nhà cung cấp là bắt buộc', 400);
    }
    if (Number(dto.quantity) <= 0) {
      throw new AppError('Số lượng nhập phải lớn hơn 0', 400);
    }
    if (Number(dto.price) < 0) {
      throw new AppError('Giá nhập không hợp lệ', 400);
    }

    try {
      return await this.materialRepository.addImport(materialId, dto);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'MATERIAL_NOT_FOUND') {
          throw new AppError('Nguyên liệu không tồn tại', 404);
        }
      }
      throw error;
    }
  }
}

export class AddMaterialExportUseCase {
  constructor(private materialRepository: MaterialRepository) {}

  async execute(materialId: string, dto: AddExportDTO): Promise<MaterialDTO> {
    if (Number(dto.quantity) <= 0) {
      throw new AppError('Số lượng xuất phải lớn hơn 0', 400);
    }

    try {
      return await this.materialRepository.addExport(materialId, dto);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'MATERIAL_NOT_FOUND') {
          throw new AppError('Nguyên liệu không tồn tại', 404);
        }
        if (error.message === 'INSUFFICIENT_STOCK') {
          throw new AppError('Số lượng tồn kho không đủ để xuất', 400);
        }
      }
      throw error;
    }
  }
}
