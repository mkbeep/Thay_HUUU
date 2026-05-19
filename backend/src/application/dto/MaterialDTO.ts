/**
 * Material DTOs - Application Layer
 */

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface MaterialDTO {
  id: string;
  name: string;
  quantity: number;
  minimum: number;
  category: string;
  status: StockStatus;
}

export interface MaterialKpiDTO {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface CreateMaterialDTO {
  name: string;
  minimum: number;
  category: string;
  import: {
    price: number;
    quantity: number;
    supplier: string;
  };
}

export interface MaterialImportDTO {
  id: string;
  createAt: string;
  price: number;
  quantity: number;
  supplier: string;
}

export interface MaterialExportDTO {
  id: string;
  createAt: string;
  quantity: number;
}

export interface MaterialHistoryEntryDTO {
  id: string;
  type: 'import' | 'export';
  createAt: string;
  quantity: number;
  price?: number;
  supplier?: string;
}

export interface AddImportDTO {
  price: number;
  quantity: number;
  supplier: string;
}

export interface AddExportDTO {
  quantity: number;
}
