import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { BestSellersModal } from '../components/BestSellersModal';
import { PeakHoursHeatmap } from '../components/PeakHoursHeatmap';
import { RevenueLineChart } from '../components/RevenueLineChart';
import { useReportsAnalytics } from '../hooks/useReports';
import { useWebSocket } from '../../../hooks/useWebSocket';
import type { BestSellerItem, ReportPeriod } from '../types/report.types';
import { formatCurrency, formatGrowth } from '../utils/formatCurrency';
import { subscribeReportUpdated } from '../utils/reportRealtime';

const TOP_SELLERS_PREVIEW = 4;

function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function weekAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return format(d, 'yyyy-MM-dd');
}

export default function ReportsPage() {
  const [timeFilter, setTimeFilter] = useState<ReportPeriod>('today');
  const [customFrom, setCustomFrom] = useState(weekAgoIso);
  const [customTo, setCustomTo] = useState(todayIso);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAllBestSellers, setShowAllBestSellers] = useState(false);

  const queryParams = useMemo(
    () => ({
      period: timeFilter,
      ...(timeFilter === 'custom' ? { from: customFrom, to: customTo } : {}),
    }),
    [timeFilter, customFrom, customTo]
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useReportsAnalytics(queryParams);
  const { on, off } = useWebSocket();

  useEffect(() => {
    const refetchReports = () => {
      void refetch();
      window.setTimeout(() => void refetch(), 500);
    };

    on('order:created', refetchReports);
    on('order:updated', refetchReports);
    on('order:status_changed', refetchReports);
    on('order:item_payment_updated', refetchReports);
    on('payment:requested', refetchReports);
    on('payment:confirmed', refetchReports);
    on('report:updated', refetchReports);
    on('connect', refetchReports);
    const unsubscribeLocal = subscribeReportUpdated(refetchReports);

    return () => {
      off('order:created', refetchReports);
      off('order:updated', refetchReports);
      off('order:status_changed', refetchReports);
      off('order:item_payment_updated', refetchReports);
      off('payment:requested', refetchReports);
      off('payment:confirmed', refetchReports);
      off('report:updated', refetchReports);
      off('connect', refetchReports);
      unsubscribeLocal();
    };
  }, [on, off, refetch]);

  const bestSellersPreview = data?.bestSellers.slice(0, TOP_SELLERS_PREVIEW) ?? [];

  const periodLabel =
    timeFilter === 'today'
      ? 'Hôm nay'
      : timeFilter === 'week'
        ? 'Tuần này'
        : timeFilter === 'month'
          ? 'Tháng này'
          : 'Tùy chỉnh';

  const handleExportCsv = (items: BestSellerItem[] = data?.bestSellers ?? []) => {
    const kpi = data?.kpi;
    const csvContent = [
      ['Báo cáo & Phân tích'],
      ['Thời gian:', periodLabel],
      ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
      [],
      ['Tổng quan'],
      ['Tổng doanh thu', kpi ? formatCurrency(kpi.totalRevenue) : '—'],
      ['Giá trị đơn TB', kpi ? formatCurrency(kpi.avgOrderValue) : '—'],
      ['Số đơn', kpi ? String(kpi.orderCount) : '—'],
      [],
      ['Món bán chạy'],
      ['Hạng', 'Tên món', 'Số lượng bán'],
      ...items.map((item) => [item.rank, item.name, item.quantitySold]),
    ];

    const csv = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bao-cao-${timeFilter}-${Date.now()}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const chartLoading = isLoading || isFetching;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Báo cáo & Phân tích
          </h1>
          <p className="text-gray-600 mt-1">Theo dõi hiệu suất kinh doanh chi tiết</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={!data}
            className="flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            Xuất báo cáo
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
              <button
                type="button"
                onClick={() => handleExportCsv()}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 text-sm font-semibold"
              >
                Xuất Excel/CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setShowExportMenu(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors text-gray-700 text-sm font-semibold"
              >
                In báo cáo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-50 rounded-xl border border-gray-200 w-fit">
        {(
          [
            ['today', 'Hôm nay'],
            ['week', 'Tuần này'],
            ['month', 'Tháng này'],
            ['custom', 'Tùy chỉnh'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTimeFilter(value)}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              timeFilter === value
                ? 'bg-white text-[#AD2C00] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {timeFilter === 'custom' && (
        <div className="flex flex-wrap items-end gap-4 p-4 bg-white rounded-xl border border-gray-200 w-fit">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-600">Ngày bắt đầu</span>
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-600">Ngày kết thúc</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={todayIso()}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
            />
          </label>
        </div>
      )}

      {isError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between gap-4">
          <span>{error instanceof Error ? error.message : 'Không tải được báo cáo'}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiCard
          variant="primary"
          title="Tổng doanh thu"
          value={data ? formatCurrency(data.kpi.totalRevenue) : '—'}
          loading={isLoading}
          growth={
            data?.kpi.revenueGrowthPercent != null
              ? `${formatGrowth(data.kpi.revenueGrowthPercent)} ${data.kpi.growthComparisonLabel ?? ''}`
              : null
          }
        />
        <KpiCard
          variant="secondary"
          title="Giá trị đơn TB"
          value={data ? formatCurrency(data.kpi.avgOrderValue) : '—'}
          loading={isLoading}
          growth={
            data?.kpi.avgOrderGrowthPercent != null
              ? `${formatGrowth(data.kpi.avgOrderGrowthPercent)} ${data.kpi.growthComparisonLabel ?? ''}`
              : null
          }
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h4 className="text-xl font-bold text-gray-900">Xu hướng doanh thu</h4>
            <p className="text-sm text-gray-500 mt-1">
              Doanh thu theo giờ (08:00 – 22:00)
            </p>
          </div>
          <RevenueLineChart
            data={data?.revenueByHour ?? []}
            loading={chartLoading && !data}
          />
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h4 className="text-xl font-bold text-gray-900 mb-6">Bán chạy nhất</h4>
          {isLoading ? (
            <p className="text-gray-400 text-sm flex-1">Đang tải...</p>
          ) : bestSellersPreview.length === 0 ? (
            <p className="text-gray-400 text-sm flex-1">Chưa có dữ liệu bán hàng</p>
          ) : (
            <div className="space-y-6 flex-1">
              {bestSellersPreview.map((item) => (
                <div key={item.foodId} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-900">{item.name}</span>
                    <span className="text-[#AD2C00]">
                      {item.quantitySold.toLocaleString('vi-VN')} đã bán
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#AD2C00] to-[#D83900] rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowAllBestSellers(true)}
            disabled={!data?.bestSellers.length}
            className="mt-8 text-sm font-bold text-[#AD2C00] hover:underline underline-offset-4 text-center disabled:opacity-40"
          >
            Xem tất cả món
          </button>
        </div>

        <div className="col-span-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-xl font-bold text-gray-900">Giờ cao điểm</h4>
              <p className="text-sm text-gray-500">Doanh thu theo ngày và giờ (tối đa 7 ngày)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Thấp</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-sm bg-orange-50" />
                <div className="w-4 h-4 rounded-sm bg-orange-200" />
                <div className="w-4 h-4 rounded-sm bg-orange-400" />
                <div className="w-4 h-4 rounded-sm bg-[#AD2C00]" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Cao</span>
            </div>
          </div>
          <PeakHoursHeatmap
            heatmap={data?.heatmap ?? { hours: [], days: [], maxRevenue: 0 }}
            loading={chartLoading && !data}
          />
        </div>
      </div>

      <BestSellersModal
        open={showAllBestSellers}
        items={data?.bestSellers ?? []}
        onClose={() => setShowAllBestSellers(false)}
        onExport={() => {
          handleExportCsv(data?.bestSellers ?? []);
          setShowAllBestSellers(false);
        }}
      />
    </div>
  );
}

function KpiCard({
  variant,
  title,
  value,
  loading,
  growth,
}: {
  variant: 'primary' | 'secondary';
  title: string;
  value: string;
  loading?: boolean;
  growth: string | null;
}) {
  const isPrimary = variant === 'primary';

  return (
    <div
      className={`p-6 rounded-2xl relative overflow-hidden shadow-sm ${
        isPrimary
          ? 'bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white'
          : 'bg-white border border-gray-100'
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 ${
          isPrimary ? 'bg-white/10' : 'bg-blue-50'
        }`}
      />
      <div className="relative">
        <p
          className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
            isPrimary ? 'opacity-90' : 'text-gray-600'
          }`}
        >
          {title}
        </p>
        <h3
          className={`text-3xl font-bold mb-3 ${isPrimary ? '' : 'text-gray-900'}`}
        >
          {loading ? '...' : value}
        </h3>
        {growth && !loading && (
          <div
            className={`text-sm font-semibold w-fit rounded-lg px-3 py-1.5 ${
              isPrimary ? 'bg-white/20' : 'text-green-600'
            }`}
          >
            {growth}
          </div>
        )}
      </div>
    </div>
  );
}
