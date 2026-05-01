export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhân viên</h1>
        <p className="text-gray-600 mt-1">Quản lý tài khoản và phân quyền</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-600">
          Tính năng quản lý nhân viên sẽ được phát triển sau khi backend API sẵn sàng.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Các tính năng: CRUD nhân viên, phân quyền (admin/manager/staff), lịch làm việc.
        </p>
      </div>
    </div>
  )
}
