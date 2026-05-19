import type { BestSellerItem } from '../types/report.types';

interface BestSellersModalProps {
  open: boolean;
  items: BestSellerItem[];
  onClose: () => void;
  onExport: () => void;
}

export function BestSellersModal({
  open,
  items,
  onClose,
  onExport,
}: BestSellersModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#AD2C00]">
              local_fire_department
            </span>
            <h3 className="text-2xl font-bold text-gray-900">Tất cả món bán chạy</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng"
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Chưa có dữ liệu bán hàng</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.foodId}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white flex items-center justify-center font-bold text-sm">
                      {item.rank}
                    </div>
                    <span className="font-bold text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-[#AD2C00] font-bold">
                    {item.quantitySold.toLocaleString('vi-VN')} đã bán
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#AD2C00] to-[#D83900] rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Xuất danh sách
          </button>
        </div>
      </div>
    </div>
  );
}
