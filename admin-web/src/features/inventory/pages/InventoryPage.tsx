import { useState, useMemo } from 'react'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Plus,
  Search,
  Filter,
  X,
  Check,
  Bell,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react'
import { MATERIAL_CATEGORIES } from '../constants/categories'
import {
  useInventoryStats,
  useMaterials,
  useInventoryAlerts,
  useMaterialHistory,
  useCreateMaterial,
  useAddImport,
  useAddExport,
} from '../hooks/useInventory'
import type { Material, StockStatus } from '../types/inventory.types'

type ModifyMode = 'import' | 'export' | null

function getStatusInfo(status: StockStatus) {
  switch (status) {
    case 'in-stock':
      return {
        name: 'Đủ hàng',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: Package,
      }
    case 'low-stock':
      return {
        name: 'Sắp hết',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: AlertTriangle,
      }
    case 'out-of-stock':
      return {
        name: 'Hết hàng',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: TrendingDown,
      }
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

const INPUT_CLASS =
  'w-full px-4 py-3 border-2 border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#AD2C00] text-gray-900 bg-white placeholder:text-gray-500'

const SELECT_CLASS =
  'w-full px-4 py-3 border-2 border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#AD2C00] text-gray-900 bg-white'

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<StockStatus | 'all'>('all')
  const [showOnlyProblems, setShowOnlyProblems] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Material | null>(null)
  const [modifyMode, setModifyMode] = useState<ModifyMode>(null)

  const [createForm, setCreateForm] = useState<{
    name: string
    minimum: string
    category: string
    importPrice: string
    importQuantity: string
    supplier: string
  }>({
    name: '',
    minimum: '',
    category: MATERIAL_CATEGORIES[0],
    importPrice: '',
    importQuantity: '',
    supplier: '',
  })

  const [importForm, setImportForm] = useState({
    price: '',
    quantity: '',
    supplier: '',
  })

  const [exportQuantity, setExportQuantity] = useState('')

  const listFilters = useMemo(
    () => ({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      status:
        showOnlyProblems
          ? undefined
          : selectedStatus === 'all'
            ? undefined
            : selectedStatus,
      search: searchQuery.trim() || undefined,
    }),
    [selectedCategory, selectedStatus, searchQuery, showOnlyProblems]
  )

  const { data: stats, isLoading: statsLoading } = useInventoryStats()
  const { data: materials = [], isLoading: listLoading, refetch } = useMaterials(listFilters)
  const { data: alerts = [] } = useInventoryAlerts()
  const { data: history = [], isLoading: historyLoading } = useMaterialHistory(
    showHistoryModal ? selectedItem?.id ?? null : null
  )

  const createMaterial = useCreateMaterial()
  const addImport = useAddImport()
  const addExport = useAddExport()

  const filteredInventory = useMemo(() => {
    if (!showOnlyProblems) return materials
    return materials.filter(
      (item) => item.status === 'low-stock' || item.status === 'out-of-stock'
    )
  }, [materials, showOnlyProblems])

  const historyImports = history.filter((h) => h.type === 'import')
  const historyExports = history.filter((h) => h.type === 'export')

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      minimum: '',
      category: MATERIAL_CATEGORIES[0],
      importPrice: '',
      importQuantity: '',
      supplier: '',
    })
  }

  const resetModifyForm = () => {
    setModifyMode(null)
    setImportForm({ price: '', quantity: '', supplier: '' })
    setExportQuantity('')
  }

  const openModify = (item: Material) => {
    setSelectedItem(item)
    resetModifyForm()
    setShowModifyModal(true)
  }

  const openHistory = (item: Material) => {
    setSelectedItem(item)
    setShowHistoryModal(true)
  }

  const handleViewAlertDetails = () => {
    setShowOnlyProblems(true)
    setSelectedStatus('all')
    setSelectedCategory('all')
    setSearchQuery('')
    setTimeout(() => {
      document.getElementById('inventory-table')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleCreateSubmit = async () => {
    const minimum = parseFloat(createForm.minimum)
    const importQuantity = parseFloat(createForm.importQuantity)
    const importPrice = parseFloat(createForm.importPrice)

    if (!createForm.name.trim()) {
      alert('Vui lòng nhập tên nguyên liệu')
      return
    }
    if (isNaN(minimum) || minimum < 0) {
      alert('Mức tối thiểu không hợp lệ')
      return
    }
    if (isNaN(importQuantity) || importQuantity <= 0) {
      alert('Số lượng nhập phải lớn hơn 0')
      return
    }
    if (isNaN(importPrice) || importPrice < 0) {
      alert('Giá nhập không hợp lệ')
      return
    }
    if (!createForm.supplier.trim()) {
      alert('Vui lòng nhập nhà cung cấp')
      return
    }

    try {
      await createMaterial.mutateAsync({
        name: createForm.name.trim(),
        minimum,
        category: createForm.category,
        import: {
          price: importPrice,
          quantity: importQuantity,
          supplier: createForm.supplier.trim(),
        },
      })
      setShowCreateModal(false)
      resetCreateForm()
      refetch()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Tạo nguyên liệu thất bại')
    }
  }

  const handleImportSubmit = async () => {
    if (!selectedItem) return

    const quantity = parseFloat(importForm.quantity)
    const price = parseFloat(importForm.price)

    if (isNaN(quantity) || quantity <= 0) {
      alert('Số lượng nhập phải lớn hơn 0')
      return
    }
    if (isNaN(price) || price < 0) {
      alert('Giá nhập không hợp lệ')
      return
    }
    if (!importForm.supplier.trim()) {
      alert('Vui lòng nhập nhà cung cấp')
      return
    }

    try {
      await addImport.mutateAsync({
        materialId: selectedItem.id,
        payload: {
          quantity,
          price,
          supplier: importForm.supplier.trim(),
        },
      })
      setShowModifyModal(false)
      setSelectedItem(null)
      resetModifyForm()
      refetch()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Nhập hàng thất bại')
    }
  }

  const handleExportSubmit = async () => {
    if (!selectedItem) return

    const quantity = parseFloat(exportQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      alert('Số lượng xuất phải lớn hơn 0')
      return
    }

    try {
      await addExport.mutateAsync({
        materialId: selectedItem.id,
        payload: { quantity },
      })
      setShowModifyModal(false)
      setSelectedItem(null)
      resetModifyForm()
      refetch()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Xuất hàng thất bại')
    }
  }

  const kpi = stats ?? { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 }
  const alertCount = kpi.lowStock + kpi.outOfStock

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Quản Lý Kho
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi tồn kho và cảnh báo nguyên liệu
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-[#AD2C00] transition-all"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>

            {showNotifications && alerts.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">Cảnh Báo Tồn Kho</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {alerts.length} nguyên liệu cần chú ý
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {alerts.map((item) => {
                    const statusInfo = getStatusInfo(item.status)
                    return (
                      <div
                        key={item.id}
                        className={`p-4 ${
                          item.status === 'out-of-stock'
                            ? 'bg-red-50/50'
                            : 'bg-yellow-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              item.status === 'out-of-stock'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }`}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {statusInfo.name} — còn {formatQuantity(item.quantity)} / tối thiểu {formatQuantity(item.minimum)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      handleViewAlertDetails()
                      setShowNotifications(false)
                    }}
                    className="w-full px-4 py-2 bg-[#AD2C00] text-white rounded-lg font-semibold hover:bg-[#D83900] transition-colors text-sm"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              resetCreateForm()
              setShowCreateModal(true)
            }}
            className="flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nhập hàng
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Tổng mặt hàng</p>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {statsLoading ? '...' : kpi.total}
          </p>
          <p className="text-xs text-gray-500 mt-1">Đang quản lý</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-sm border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">Đủ hàng</p>
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">
            {statsLoading ? '...' : kpi.inStock}
          </p>
          <p className="text-xs text-green-600 mt-1">Tồn kho ổn định</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-yellow-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wider">Sắp hết</p>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-900">
            {statsLoading ? '...' : kpi.lowStock}
          </p>
          <p className="text-xs text-yellow-600 mt-1">Cần theo dõi</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl shadow-sm border border-red-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-red-700 uppercase tracking-wider">Hết hàng</p>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-900">
            {statsLoading ? '...' : kpi.outOfStock}
          </p>
          <p className="text-xs text-red-600 mt-1">Dưới mức tối thiểu</p>
        </div>
      </div>

      {/* Alert banner */}
      {kpi.lowStock > 0 || kpi.outOfStock > 0 ? (
        <div className="bg-gradient-to-r from-[#AD2C00] to-[#D83900] p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Cảnh Báo Tồn Kho</h3>
              <p className="text-white/90 mb-4">
                Có {kpi.lowStock} mặt hàng sắp hết và {kpi.outOfStock} mặt hàng đã hết.
              </p>
              <button
                onClick={handleViewAlertDetails}
                className="px-4 py-2 bg-white text-[#AD2C00] rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Table */}
      <div
        id="inventory-table"
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        {showOnlyProblems && (
          <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-bold text-red-900">
                  Đang hiển thị nguyên liệu sắp hết / hết hàng
                </p>
                <p className="text-sm text-red-700">
                  {filteredInventory.length} mặt hàng
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOnlyProblems(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Xem tất cả
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
              placeholder="Tìm kiếm nguyên liệu..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
            >
              <option value="all">Tất cả danh mục</option>
              {MATERIAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as StockStatus | 'all')
              }
              disabled={showOnlyProblems}
              className="bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all disabled:opacity-50"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="in-stock">Đủ hàng</option>
              <option value="low-stock">Sắp hết</option>
              <option value="out-of-stock">Hết hàng</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="px-4 py-3 text-left">Nguyên liệu</th>
                <th className="px-4 py-3 text-center">Tồn kho</th>
                <th className="px-4 py-3 text-center">Mức tối thiểu</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const statusInfo = getStatusInfo(item.status)
                  const StatusIcon = statusInfo.icon
                  const barMax = Math.max(item.minimum * 2, item.quantity, 1)
                  const stockPercentage = (item.quantity / barMax) * 100

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="font-bold text-gray-900">
                          {formatQuantity(item.quantity)}
                        </p>
                        <div className="w-full max-w-[120px] mx-auto bg-gray-200 h-1.5 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${
                              stockPercentage > 50
                                ? 'bg-green-500'
                                : stockPercentage > 20
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.min(stockPercentage, 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <p className="text-sm text-gray-600">
                          {formatQuantity(item.minimum)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModify(item)}
                            className="px-3 py-2 bg-[#AD2C00] text-white rounded-lg hover:bg-[#D83900] transition-colors text-sm font-semibold"
                          >
                            Modify
                          </button>
                          <button
                            onClick={() => openHistory(item)}
                            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            title="Lịch sử nhập/xuất"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!listLoading && filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy nguyên liệu nào</p>
          </div>
        )}
      </div>

      {/* Create new material modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Tạo Nguyên Liệu Mới
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Nhập thông tin và lô hàng đầu tiên
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Tên nguyên liệu <span className="text-red-500">*</span>
                </label>
                <input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className={INPUT_CLASS}
                  placeholder="VD: Cá Hồi Tươi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Mức tối thiểu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={createForm.minimum}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, minimum: e.target.value })
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, category: e.target.value })
                    }
                    className={INPUT_CLASS}
                  >
                    {MATERIAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-bold text-gray-700 mb-3">
                  Lô nhập đầu tiên
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Số lượng nhập *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={createForm.importQuantity}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            importQuantity: e.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Giá nhập *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={createForm.importPrice}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            importPrice: e.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Nhà cung cấp *
                    </label>
                    <input
                      value={createForm.supplier}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          supplier: e.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                      placeholder="Tên nhà cung cấp"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateSubmit}
                disabled={createMaterial.isPending}
                className="w-full px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {createMaterial.isPending ? 'Đang tạo...' : 'Tạo nguyên liệu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify modal */}
      {showModifyModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Modify: {selectedItem.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Tồn kho hiện tại: {formatQuantity(selectedItem.quantity)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModifyModal(false)
                  setSelectedItem(null)
                  resetModifyForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!modifyMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setModifyMode('import')}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-[#AD2C00] hover:bg-[#AD2C00]/5 transition-all"
                  >
                    <ArrowDownToLine className="w-8 h-8 text-[#AD2C00]" />
                    <span className="font-bold text-gray-900">Nhập thêm hàng</span>
                  </button>
                  <button
                    onClick={() => setModifyMode('export')}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <ArrowUpFromLine className="w-8 h-8 text-gray-600" />
                    <span className="font-bold text-gray-900">Xuất hàng</span>
                  </button>
                </div>
              ) : modifyMode === 'import' ? (
                <>
                  <button
                    onClick={() => setModifyMode(null)}
                    className="text-sm text-[#AD2C00] font-semibold hover:underline"
                  >
                    ← Quay lại
                  </button>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Số lượng nhập *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={importForm.quantity}
                        onChange={(e) =>
                          setImportForm({
                            ...importForm,
                            quantity: e.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Giá nhập *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={importForm.price}
                        onChange={(e) =>
                          setImportForm({ ...importForm, price: e.target.value })
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Nhà cung cấp *
                      </label>
                      <input
                        value={importForm.supplier}
                        onChange={(e) =>
                          setImportForm({
                            ...importForm,
                            supplier: e.target.value,
                          })
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleImportSubmit}
                    disabled={addImport.isPending}
                    className="w-full px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {addImport.isPending ? 'Đang xử lý...' : 'Xác nhận nhập hàng'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setModifyMode(null)}
                    className="text-sm text-gray-600 font-semibold hover:underline"
                  >
                    ← Quay lại
                  </button>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Số lượng xuất *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      max={selectedItem.quantity}
                      value={exportQuantity}
                      onChange={(e) => setExportQuantity(e.target.value)}
                      className={`${INPUT_CLASS} focus:ring-gray-600`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tối đa: {formatQuantity(selectedItem.quantity)}
                    </p>
                  </div>
                  <button
                    onClick={handleExportSubmit}
                    disabled={addExport.isPending}
                    className="w-full px-6 py-3 bg-gray-800 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {addExport.isPending ? 'Đang xử lý...' : 'Xác nhận xuất hàng'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History modal */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Lịch sử: {selectedItem.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Nhập hàng và xuất hàng
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false)
                  setSelectedItem(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {historyLoading ? (
                <p className="text-center text-gray-500 py-8">Đang tải...</p>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <ArrowDownToLine className="w-5 h-5 text-[#AD2C00]" />
                      Nhập hàng ({historyImports.length})
                    </h3>
                    {historyImports.length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có giao dịch nhập</p>
                    ) : (
                      <div className="space-y-2">
                        {historyImports.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex justify-between items-center p-3 bg-green-50 border border-green-100 rounded-lg"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">
                                +{formatQuantity(entry.quantity)}
                              </p>
                              <p className="text-xs text-gray-600">
                                {entry.supplier} •{' '}
                                {entry.price?.toLocaleString('vi-VN')} đ
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(entry.createAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <ArrowUpFromLine className="w-5 h-5 text-gray-600" />
                      Xuất hàng ({historyExports.length})
                    </h3>
                    {historyExports.length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có giao dịch xuất</p>
                    ) : (
                      <div className="space-y-2">
                        {historyExports.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <p className="font-semibold text-gray-900">
                              -{formatQuantity(entry.quantity)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(entry.createAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
