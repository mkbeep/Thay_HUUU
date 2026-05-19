/**
 * Pure aggregation logic for reports (orders + items).
 * Revenue = sum(quantity * unit_price) per order items.
 * Valid orders exclude status === 'cancelled'.
 */
import type {
  BestSellerItemDTO,
  HeatmapDayDTO,
  ReportKpiDTO,
  ReportPeriod,
  RevenueByHourPointDTO,
} from '../../application/dto/ReportDTO';
import { startOfDay, endOfDay, type DateRange } from './reportDateRanges';

export const REPORT_HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08–22

export interface ReportOrderItem {
  food_id: string;
  quantity: number;
  unit_price: number;
}

export interface ReportOrder {
  id: string;
  created_at: Date;
  status?: string;
  items: ReportOrderItem[];
}

function isValidOrder(order: ReportOrder): boolean {
  return order.status !== 'cancelled';
}

export function orderRevenue(order: ReportOrder): number {
  return order.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  );
}

function filterOrdersInRange(orders: ReportOrder[], range: DateRange): ReportOrder[] {
  return orders.filter((o) => {
    const t = o.created_at.getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
  });
}

function calcGrowthPercent(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function aggregateKpi(
  orders: ReportOrder[],
  current: DateRange,
  previous: DateRange | null,
  growthComparisonLabel: string | null
): ReportKpiDTO {
  const currentOrders = filterOrdersInRange(orders, current).filter(isValidOrder);
  const totalRevenue = currentOrders.reduce((s, o) => s + orderRevenue(o), 0);
  const orderCount = currentOrders.length;
  const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  let revenueGrowthPercent: number | null = null;
  let avgOrderGrowthPercent: number | null = null;

  if (previous) {
    const prevOrders = filterOrdersInRange(orders, previous).filter(isValidOrder);
    const prevRevenue = prevOrders.reduce((s, o) => s + orderRevenue(o), 0);
    const prevCount = prevOrders.length;
    const prevAvg = prevCount > 0 ? prevRevenue / prevCount : 0;

    revenueGrowthPercent = calcGrowthPercent(totalRevenue, prevRevenue);
    avgOrderGrowthPercent = calcGrowthPercent(avgOrderValue, prevAvg);
  }

  return {
    totalRevenue,
    avgOrderValue,
    orderCount,
    revenueGrowthPercent,
    avgOrderGrowthPercent,
    growthComparisonLabel,
  };
}

export function aggregateRevenueByHour(orders: ReportOrder[], range: DateRange): RevenueByHourPointDTO[] {
  const inRange = filterOrdersInRange(orders, range).filter(isValidOrder);
  const byHour = new Map<number, number>();

  for (const hour of REPORT_HOURS) {
    byHour.set(hour, 0);
  }

  for (const order of inRange) {
    const hour = order.created_at.getHours();
    if (hour < 8 || hour > 22) continue;
    byHour.set(hour, (byHour.get(hour) || 0) + orderRevenue(order));
  }

  return REPORT_HOURS.map((hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    revenue: byHour.get(hour) || 0,
  }));
}

export function aggregateBestSellers(
  orders: ReportOrder[],
  range: DateRange,
  foodNames: Map<string, string>
): BestSellerItemDTO[] {
  const inRange = filterOrdersInRange(orders, range).filter(isValidOrder);
  const qtyByFood = new Map<string, number>();

  for (const order of inRange) {
    for (const item of order.items) {
      if (!item.food_id) continue;
      qtyByFood.set(
        item.food_id,
        (qtyByFood.get(item.food_id) || 0) + Number(item.quantity || 0)
      );
    }
  }

  const sorted = [...qtyByFood.entries()].sort((a, b) => b[1] - a[1]);
  const maxQty = sorted[0]?.[1] || 1;

  return sorted.map(([foodId, quantitySold], index) => ({
    rank: index + 1,
    foodId,
    name: foodNames.get(foodId) || `Món #${foodId.slice(0, 6)}`,
    quantitySold,
    percentage: Math.round((quantitySold / maxQty) * 100),
  }));
}

function formatDayLabel(date: Date): string {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[date.getDay()];
}

function dateKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}

function enumerateDays(range: DateRange): Date[] {
  const days: Date[] = [];
  const cur = startOfDay(range.start);
  const end = startOfDay(range.end);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function revenueByDay(orders: ReportOrder[], range: DateRange): Map<string, number> {
  const map = new Map<string, number>();
  for (const order of filterOrdersInRange(orders, range).filter(isValidOrder)) {
    const key = dateKey(order.created_at);
    map.set(key, (map.get(key) || 0) + orderRevenue(order));
  }
  return map;
}

/** Select up to 7 days for heatmap per product rules. */
export function selectHeatmapDays(
  period: ReportPeriod,
  range: DateRange,
  orders: ReportOrder[]
): Date[] {
  const allDays = enumerateDays(range);
  if (allDays.length === 0) return [];

  if (period === 'today' || period === 'week') {
    const end = startOfDay(range.end);
    const selected: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      selected.push(d);
    }
    return selected;
  }

  if (allDays.length <= 7) return allDays;

  const revByDay = revenueByDay(orders, range);
  const ranked = allDays
    .map((d) => ({ d, revenue: revByDay.get(dateKey(d)) || 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 7)
    .map((x) => x.d)
    .sort((a, b) => a.getTime() - b.getTime());

  return ranked;
}

export function aggregateHeatmap(
  orders: ReportOrder[],
  range: DateRange,
  period: ReportPeriod
): { hours: number[]; days: HeatmapDayDTO[]; maxRevenue: number } {
  const selectedDays = selectHeatmapDays(period, range, orders);
  const inRange = filterOrdersInRange(orders, range).filter(isValidOrder);

  let maxRevenue = 0;
  const days: HeatmapDayDTO[] = selectedDays.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const cells = REPORT_HOURS.map((hour) => {
      let revenue = 0;
      for (const order of inRange) {
        const created = order.created_at;
        if (created < dayStart || created > dayEnd) continue;
        if (created.getHours() !== hour) continue;
        revenue += orderRevenue(order);
      }
      if (revenue > maxRevenue) maxRevenue = revenue;
      return { hour, revenue };
    });

    return {
      date: dateKey(day),
      label: formatDayLabel(day),
      cells,
    };
  });

  return { hours: [...REPORT_HOURS], days, maxRevenue };
}

export function growthLabelForPeriod(period: ReportPeriod): string | null {
  switch (period) {
    case 'today':
      return 'so với hôm qua';
    case 'week':
      return 'so với tuần trước';
    case 'month':
      return 'so với tháng trước';
    default:
      return null;
  }
}
