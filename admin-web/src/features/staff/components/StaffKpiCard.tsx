interface StaffKpiCardProps {
  count: number;
  isLoading?: boolean;
}

export function StaffKpiCard({ count, isLoading }: StaffKpiCardProps) {
  return (
    <div className="mb-8">
      <div className="bg-[#AD2C00] p-6 rounded-xl text-white flex flex-col justify-between h-40 max-w-sm">
        <span className="material-symbols-outlined opacity-60 text-3xl">Tổng cộng</span>
        <div>
          {isLoading ? (
            <div className="h-9 w-16 bg-white/20 rounded animate-pulse mb-2" />
          ) : (
            <p className="text-3xl font-bold">{count}</p>
          )}
          <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">
            Nhân sự đang hoạt động
          </p>
        </div>
      </div>
    </div>
  );
}
