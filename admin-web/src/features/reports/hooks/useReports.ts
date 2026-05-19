import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reportsApi';
import type { ReportsQueryParams } from '../types/report.types';

export const reportsQueryKeys = {
  analytics: (params: ReportsQueryParams) => ['reports', 'analytics', params] as const,
};

export function useReportsAnalytics(params: ReportsQueryParams) {
  const enabled =
    params.period !== 'custom' || Boolean(params.from && params.to);

  return useQuery({
    queryKey: reportsQueryKeys.analytics(params),
    queryFn: () => reportsApi.getAnalytics(params),
    enabled,
  });
}
