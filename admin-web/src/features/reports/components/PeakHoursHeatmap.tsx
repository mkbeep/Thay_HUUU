import { Fragment } from 'react';
import type { ReportsAnalytics } from '../types/report.types';

interface PeakHoursHeatmapProps {
  heatmap: ReportsAnalytics['heatmap'];
  loading?: boolean;
}

function hourLabel(hour: number): string {
  if (hour === 12) return '12p';
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function cellClass(revenue: number, max: number): string {
  if (max <= 0 || revenue <= 0) return 'bg-orange-50';
  const ratio = revenue / max;
  if (ratio >= 0.75) return 'bg-[#AD2C00]';
  if (ratio >= 0.5) return 'bg-orange-400';
  if (ratio >= 0.25) return 'bg-orange-200';
  return 'bg-orange-100';
}

export function PeakHoursHeatmap({ heatmap, loading }: PeakHoursHeatmapProps) {
  const { hours, days, maxRevenue } = heatmap;

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">Đang tải heatmap...</div>
    );
  }

  if (!days.length) {
    return (
      <div className="py-16 text-center text-gray-400 text-sm">
        Chưa có dữ liệu giờ cao điểm
      </div>
    );
  }

  const colTemplate = `80px repeat(${hours.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: colTemplate }}
        >
          <div className="h-6" />
          {hours.map((h) => (
            <div key={h} className="text-[10px] text-gray-400 font-bold text-center">
              {hourLabel(h)}
            </div>
          ))}

          {days.map((day) => (
            <Fragment key={day.date}>
              <div
                className="text-[10px] font-black uppercase text-gray-900 py-1"
                title={day.date}
              >
                {day.label}
              </div>
              {day.cells.map((cell) => (
                <div
                  key={`${day.date}-${cell.hour}`}
                  className={`rounded-sm aspect-square min-h-[20px] ${cellClass(
                    cell.revenue,
                    maxRevenue
                  )}`}
                  title={`${day.date} ${String(cell.hour).padStart(2, '0')}:00 — ${cell.revenue.toLocaleString('vi-VN')}₫`}
                />
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
