export type ReportPeriod = 'today' | 'week' | 'month' | 'custom';

export interface ReportKpi {
  totalRevenue: number;
  avgOrderValue: number;
  orderCount: number;
  revenueGrowthPercent: number | null;
  avgOrderGrowthPercent: number | null;
  growthComparisonLabel: string | null;
}

export interface RevenueByHourPoint {
  hour: number;
  label: string;
  revenue: number;
}

export interface BestSellerItem {
  rank: number;
  foodId: string;
  name: string;
  quantitySold: number;
  percentage: number;
}

export interface HeatmapDay {
  date: string;
  label: string;
  cells: { hour: number; revenue: number }[];
}

export interface ReportsAnalytics {
  period: ReportPeriod;
  currentRange: { from: string; to: string };
  kpi: ReportKpi;
  revenueByHour: RevenueByHourPoint[];
  bestSellers: BestSellerItem[];
  heatmap: {
    hours: number[];
    days: HeatmapDay[];
    maxRevenue: number;
  };
}

export interface ReportsQueryParams {
  period: ReportPeriod;
  from?: string;
  to?: string;
}
