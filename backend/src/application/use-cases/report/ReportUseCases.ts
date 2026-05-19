/**
 * Reports Use Cases - Application Layer
 */
import { AppError } from '../../errors/AppError';
import type { ReportPeriod, ReportsAnalyticsDTO } from '../../dto/ReportDTO';
import {
  aggregateBestSellers,
  aggregateHeatmap,
  aggregateKpi,
  aggregateRevenueByHour,
  growthLabelForPeriod,
} from '../../../domain/utils/reportAggregations';
import {
  getFetchRange,
  getReportDateRanges,
} from '../../../domain/utils/reportDateRanges';
import { ReportRepository } from '../../../infrastructure/database/repositories/ReportRepository';

export class GetReportsAnalyticsUseCase {
  constructor(private reportRepository: ReportRepository) {}

  async execute(params: {
    period: ReportPeriod;
    from?: string;
    to?: string;
  }): Promise<ReportsAnalyticsDTO> {
    const { period, from, to } = params;

    let ranges;
    try {
      ranges = getReportDateRanges(period, from, to);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'INVALID_PARAMS';
      if (msg === 'CUSTOM_RANGE_REQUIRED') {
        throw new AppError('Vui lòng chọn ngày bắt đầu và ngày kết thúc', 400);
      }
      if (msg === 'INVALID_DATE_RANGE') {
        throw new AppError('Ngày bắt đầu phải trước ngày kết thúc', 400);
      }
      throw new AppError('Bộ lọc thời gian không hợp lệ', 400);
    }

    const { current, previous } = ranges;
    const fetchRange = getFetchRange(current, previous);
    const orders = await this.reportRepository.findOrdersInRange(fetchRange);

    const foodIds = new Set<string>();
    for (const order of orders) {
      for (const item of order.items) {
        if (item.food_id) foodIds.add(item.food_id);
      }
    }
    const foodNames = await this.reportRepository.getFoodNamesByIds([...foodIds]);

    const growthLabel = growthLabelForPeriod(period);
    const kpi = aggregateKpi(
      orders,
      current,
      previous,
      period === 'custom' ? null : growthLabel
    );

    const revenueByHour = aggregateRevenueByHour(orders, current);
    const bestSellers = aggregateBestSellers(orders, current, foodNames);
    const heatmap = aggregateHeatmap(orders, current, period);

    return {
      period,
      currentRange: {
        from: current.start.toISOString(),
        to: current.end.toISOString(),
      },
      kpi,
      revenueByHour,
      bestSellers,
      heatmap,
    };
  }
}
