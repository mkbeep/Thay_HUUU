export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
        <p className="text-gray-600 mt-1">Theo dõi và xử lý đơn hàng real-time</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-600">
          Tính năng quản lý đơn hàng sẽ được phát triển sau khi backend API sẵn sàng.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Các tính năng: Xem đơn hàng real-time, cập nhật trạng thái, lịch sử đơn hàng, thống kê.
        </p>
      </div>
    </div>
  )
}
