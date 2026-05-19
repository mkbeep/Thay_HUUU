/**
 * Report Controller - Presentation Layer
 */
import { Request, Response, NextFunction } from 'express';
import { GetReportsAnalyticsUseCase } from '../../application/use-cases/report/ReportUseCases';
import { ReportRepository } from '../../infrastructure/database/repositories/ReportRepository';
import type { ReportPeriod } from '../../application/dto/ReportDTO';

const VALID_PERIODS: ReportPeriod[] = ['today', 'week', 'month', 'custom'];

export class ReportController {
  private getAnalyticsUseCase: GetReportsAnalyticsUseCase;

  constructor() {
    const reportRepository = new ReportRepository();
    this.getAnalyticsUseCase = new GetReportsAnalyticsUseCase(reportRepository);
  }

  /**
   * GET /api/v1/reports/analytics?period=today|week|month|custom&from=&to=
   */
  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const period = (req.query.period as string) || 'today';
      if (!VALID_PERIODS.includes(period as ReportPeriod)) {
        res.status(400).json({
          success: false,
          message: 'period phải là today, week, month hoặc custom',
        });
        return;
      }

      const data = await this.getAnalyticsUseCase.execute({
        period: period as ReportPeriod,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      });

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}
