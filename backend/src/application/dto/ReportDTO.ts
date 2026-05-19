/**
 * Reports & Analytics DTOs
 */

export type ReportPeriod = 'today' | 'week' | 'month' | 'custom';

export interface ReportDateRange {
  from: string;
  to: string;
}

export interface ReportKpiDTO {
  totalRevenue: number;
  avgOrderValue: number;
  orderCount: number;
  /** null when period is custom */
  revenueGrowthPercent: number | null;
  avgOrderGrowthPercent: number | null;
  growthComparisonLabel: string | null;
}

export interface RevenueByHourPointDTO {
  hour: number;
  label: string;
  revenue: number;
}

export interface BestSellerItemDTO {
  rank: number;
  foodId: string;
  name: string;
  quantitySold: number;
  /** 0–100 relative to top seller for progress bars */
  percentage: number;
}

export interface HeatmapDayDTO {
  date: string;
  label: string;
  cells: { hour: number; revenue: number }[];
}

export interface ReportsAnalyticsDTO {
  period: ReportPeriod;
  currentRange: ReportDateRange;
  kpi: ReportKpiDTO;
  revenueByHour: RevenueByHourPointDTO[];
  bestSellers: BestSellerItemDTO[];
  heatmap: {
    hours: number[];
    days: HeatmapDayDTO[];
    maxRevenue: number;
  };
}
