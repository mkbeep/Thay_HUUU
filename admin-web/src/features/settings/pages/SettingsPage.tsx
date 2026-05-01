export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600 mt-1">Cấu hình hệ thống</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-600">
          Tính năng cài đặt sẽ được phát triển sau khi backend API sẵn sàng.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Các tính năng: Thông tin nhà hàng, cấu hình thanh toán, thuế, email, thông báo.
        </p>
      </div>
    </div>
  )
}
