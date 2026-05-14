/**
 * Inventory Entity - Domain Layer
 */

export enum InventoryUnit {
  KG = 'kg',
  G = 'g',
  L = 'l',
  ML = 'ml',
  PIECE = 'piece',
  PACK = 'pack'
}

export interface Inventory {
  id: string;
  item_name: string;
  description?: string;
  category: string;
  current_quantity: number;
  unit: InventoryUnit;
  minimum_quantity: number;
  reorder_quantity: number;
  unit_cost: number;
  supplier?: string;
  /** ID món trong `food` (có thể nhiều món dùng cùng NL) — tách tên nguyên liệu vs tên món. */
  linked_food_ids?: string[];
  last_restocked_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryTransaction {
  id: string;
  inventory_id: string;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit_cost?: number;
  reference_id?: string;
  notes?: string;
  created_by: string;
  created_at: Date;
}
