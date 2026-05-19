import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RevenueByHourPoint } from '../types/report.types';
import { formatCurrency } from '../utils/formatCurrency';

interface RevenueLineChartProps {
  data: RevenueByHourPoint[];
  loading?: boolean;
}

export function RevenueLineChart({ data, loading }: RevenueLineChartProps) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        Đang tải biểu đồ...
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={(v) =>
              v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}tr`
                : `${Math.round(v / 1000)}k`
            }
            width={48}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
            labelFormatter={(label) => `Giờ ${label}`}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#AD2C00"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#AD2C00' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
