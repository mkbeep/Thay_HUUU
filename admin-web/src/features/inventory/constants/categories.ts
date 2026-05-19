export const MATERIAL_CATEGORIES = [
  'Hải sản',
  'Thịt',
  'Rau củ',
  'Đồ uống',
  'Gia vị',
  'Sữa',
] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];
