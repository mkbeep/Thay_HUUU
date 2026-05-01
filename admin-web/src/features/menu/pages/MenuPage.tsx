import { Plus } from 'lucide-react'

export default function MenuPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Menu</h1>
          <p className="text-gray-600 mt-1">Quản lý món ăn và thực đơn</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          <Plus className="w-5 h-5" />
          Thêm món mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-600">
          Tính năng quản lý menu sẽ được phát triển sau khi backend API sẵn sàng.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Các tính năng: CRUD món ăn, quản lý danh mục, giá cả, hình ảnh, trạng thái còn hàng.
        </p>
      </div>
    </div>
  )
}
