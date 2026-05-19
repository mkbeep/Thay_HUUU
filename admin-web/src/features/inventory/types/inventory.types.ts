export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export interface Material {
  id: string;
  name: string;
  quantity: number;
  minimum: number;
  category: string;
  status: StockStatus;
}

export interface MaterialKpi {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface CreateMaterialPayload {
  name: string;
  minimum: number;
  category: string;
  import: {
    price: number;
    quantity: number;
    supplier: string;
  };
}

export interface AddImportPayload {
  price: number;
  quantity: number;
  supplier: string;
}

export interface AddExportPayload {
  quantity: number;
}

export interface MaterialHistoryEntry {
  id: string;
  type: 'import' | 'export';
  createAt: string;
  quantity: number;
  price?: number;
  supplier?: string;
}
