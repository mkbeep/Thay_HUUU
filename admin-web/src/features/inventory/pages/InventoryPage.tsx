import { useState, useEffect } from 'react'
import { Package, AlertTriangle, TrendingDown, Plus, Edit, Search, Filter, X, Check, Bell } from 'lucide-react'

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

interface InventoryItem {
  id: number
  name: string
  category: string
  currentStock: number
  unit: string
  minStock: number
  maxStock: number
  usageRate: number
  estimatedDaysLeft: number
  lastRestocked: string
  supplier: string
  status: StockStatus
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<StockStatus | 'all'>('all')
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [restockAmount, setRestockAmount] = useState('')
  const [restockNote, setRestockNote] = useState('')
  const [notifications, setNotifications] = useState<Array<{id: number, message: string, type: 'warning' | 'danger'}>>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showOnlyProblems, setShowOnlyProblems] = useState(false)

  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: 1,
      name: 'Cá Hồi Tươi',
      category: 'Hải sản',
      currentStock: 15,
      unit: 'kg',
      minStock: 20,
      maxStock: 100,
      usageRate: 12,
      estimatedDaysLeft: 1.25,
      lastRestocked: '2026-05-01',
      supplier: 'Hải Sản Tươi Sống',
      status: 'low-stock'
    },
    {
      id: 2,
      name: 'Thịt Bò Wagyu',
      category: 'Thịt',
      currentStock: 8,
      unit: 'kg',
      minStock: 15,
      maxStock: 50,
      usageRate: 6,
      estimatedDaysLeft: 1.3,
      lastRestocked: '2026-04-30',
      supplier: 'Thịt Cao Cấp VN',
      status: 'low-stock'
    },
    {
      id: 3,
      name: 'Nấm Truffle Đen',
      category: 'Rau củ',
      currentStock: 2,
      unit: 'kg',
      minStock: 5,
      maxStock: 20,
      usageRate: 1.5,
      estimatedDaysLeft: 1.3,
      lastRestocked: '2026-04-28',
      supplier: 'Nấm Nhập Khẩu',
      status: 'low-stock'
    },
    {
      id: 4,
      name: 'Rượu Vang Đỏ',
      category: 'Đồ uống',
      currentStock: 45,
      unit: 'chai',
      minStock: 30,
      maxStock: 100,
      usageRate: 8,
      estimatedDaysLeft: 5.6,
      lastRestocked: '2026-04-25',
      supplier: 'Rượu Vang Pháp',
      status: 'in-stock'
    },
    {
      id: 5,
      name: 'Phô Mai Burrata',
      category: 'Sữa',
      currentStock: 0,
      unit: 'kg',
      minStock: 10,
      maxStock: 30,
      usageRate: 4,
      estimatedDaysLeft: 0,
      lastRestocked: '2026-04-20',
      supplier: 'Phô Mai Ý',
      status: 'out-of-stock'
    },
    {
      id: 6,
      name: 'Dầu Olive',
      category: 'Gia vị',
      currentStock: 25,
      unit: 'lít',
      minStock: 15,
      maxStock: 50,
      usageRate: 3,
      estimatedDaysLeft: 8.3,
      lastRestocked: '2026-04-15',
      supplier: 'Dầu Ăn Nhập Khẩu',
      status: 'in-stock'
    },
    {
      id: 7,
      name: 'Tôm Hùm',
      category: 'Hải sản',
      currentStock: 12,
      unit: 'con',
      minStock: 10,
      maxStock: 40,
      usageRate: 5,
      estimatedDaysLeft: 2.4,
      lastRestocked: '2026-05-02',
      supplier: 'Hải Sản Tươi Sống',
      status: 'in-stock'
    },
    {
      id: 8,
      name: 'Bơ Lên Men',
      category: 'Sữa',
      currentStock: 18,
      unit: 'kg',
      minStock: 20,
      maxStock: 60,
      usageRate: 7,
      estimatedDaysLeft: 2.6,
      lastRestocked: '2026-04-29',
      supplier: 'Sữa Tươi Đà Lạt',
      status: 'low-stock'
    }
  ])

  useEffect(() => {
    checkStockLevels()
  }, [inventory])

  const checkStockLevels = () => {
    const newNotifications: Array<{id: number, message: string, type: 'warning' | 'danger'}> = []
    
    inventory.forEach(item => {
      if (item.status === 'out-of-stock') {
        newNotifications.push({
          id: item.id,
          message: `${item.name} đã hết hàng! Cần nhập ngay.`,
          type: 'danger'
        })
      } else if (item.status === 'low-stock') {
        newNotifications.push({
          id: item.id,
          message: `${item.name} sắp hết (còn ${item.currentStock} ${item.unit}). Dự kiến hết trong ${item.estimatedDaysLeft.toFixed(1)} ngày.`,
          type: 'warning'
        })
      }
    })
    
    setNotifications(newNotifications)
  }

  const handleRestockClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setRestockAmount('')
    setRestockNote('')
    setShowRestockModal(true)
  }

  const handleRestockSubmit = () => {
    if (!selectedItem || !restockAmount || parseFloat(restockAmount) <= 0) {
      alert('Vui lòng nhập số lượng hợp lệ')
      return
    }

    const amount = parseFloat(restockAmount)
    const today = new Date().toISOString().split('T')[0]

    setInventory(prev => prev.map(item => {
      if (item.id === selectedItem.id) {
        const newStock = item.currentStock + amount
        const newEstimatedDays = newStock / item.usageRate
        let newStatus: StockStatus = 'in-stock'
        
        if (newStock === 0) {
          newStatus = 'out-of-stock'
        } else if (newStock < item.minStock) {
          newStatus = 'low-stock'
        }

        return {
          ...item,
          currentStock: newStock,
          estimatedDaysLeft: newEstimatedDays,
          lastRestocked: today,
          status: newStatus
        }
      }
      return item
    }))

    setShowRestockModal(false)
    setSelectedItem(null)
    setRestockAmount('')
    setRestockNote('')
  }

  const getStatusInfo = (status: StockStatus) => {
    switch (status) {
      case 'in-stock':
        return {
          name: 'Đủ hàng',
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: Package
        }
      case 'low-stock':
        return {
          name: 'Sắp hết',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          icon: AlertTriangle
        }
      case 'out-of-stock':
        return {
          name: 'Hết hàng',
          color: 'bg-red-100 text-red-700 border-red-200',
          icon: TrendingDown
        }
    }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
    const matchesProblems = !showOnlyProblems || item.status === 'low-stock' || item.status === 'out-of-stock'
    return matchesSearch && matchesCategory && matchesStatus && matchesProblems
  })

  const stats = {
    total: inventory.length,
    lowStock: inventory.filter(i => i.status === 'low-stock').length,
    outOfStock: inventory.filter(i => i.status === 'out-of-stock').length,
    inStock: inventory.filter(i => i.status === 'in-stock').length
  }

  const categories = ['all', ...Array.from(new Set(inventory.map(i => i.category)))]

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
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && notifications.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">Cảnh Báo Tồn Kho</h3>
                  <p className="text-xs text-gray-500 mt-1">{notifications.length} cảnh báo</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif) => {
                    const item = inventory.find(i => i.id === notif.id)
                    return (
                      <button
                        key={notif.id}
                        onClick={() => {
                          if (item) {
                            setSelectedItem(item)
                            setShowRestockModal(true)
                            setShowNotifications(false)
                          }
                        }}
                        className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                          notif.type === 'danger' ? 'bg-red-50/50' : 'bg-yellow-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notif.type === 'danger' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 mb-1">{notif.message}</p>
                            <p className="text-xs text-gray-500">Click để nhập hàng</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      setShowOnlyProblems(true)
                      setSelectedStatus('all')
                      setSelectedCategory('all')
                      setSearchQuery('')
                      setShowNotifications(false)
                      setTimeout(() => {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                      }, 100)
                    }}
                    className="w-full px-4 py-2 bg-[#AD2C00] text-white rounded-lg font-semibold hover:bg-[#D83900] transition-colors text-sm"
                  >
                    Xem tất cả mặt hàng có vấn đề
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setSelectedItem(null)
              setShowRestockModal(true)
            }}
            className="flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nhập hàng
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Tổng mặt hàng</p>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Đang quản lý</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-sm border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">Đủ hàng</p>
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">{stats.inStock}</p>
          <p className="text-xs text-green-600 mt-1">Tồn kho ổn định</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-yellow-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-yellow-700 uppercase tracking-wider">Sắp hết</p>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-900">{stats.lowStock}</p>
          <p className="text-xs text-yellow-600 mt-1">Cần nhập hàng</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl shadow-sm border border-red-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-red-700 uppercase tracking-wider">Hết hàng</p>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-900">{stats.outOfStock}</p>
          <p className="text-xs text-red-600 mt-1">Cần nhập ngay</p>
        </div>
      </div>

      {stats.lowStock > 0 || stats.outOfStock > 0 ? (
        <div className="bg-gradient-to-r from-[#AD2C00] to-[#D83900] p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Cảnh Báo Tồn Kho</h3>
              <p className="text-white/90 mb-4">
                Có {stats.lowStock} mặt hàng sắp hết và {stats.outOfStock} mặt hàng đã hết. 
                Vui lòng nhập hàng để đảm bảo hoạt động kinh doanh.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowOnlyProblems(true)
                    setSelectedStatus('all')
                    setSelectedCategory('all')
                    setSearchQuery('')
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                  }}
                  className="px-4 py-2 bg-white text-[#AD2C00] rounded-lg font-semibold hover:bg-white/90 transition-colors"
                >
                  Xem chi tiết
                </button>
                <button 
                  onClick={() => {
                    const outOfStockItems = inventory.filter(i => i.status === 'out-of-stock')
                    const lowStockItems = inventory.filter(i => i.status === 'low-stock')
                    const criticalItem = outOfStockItems.length > 0 
                      ? outOfStockItems[0] 
                      : lowStockItems.length > 0 
                        ? lowStockItems.sort((a, b) => a.estimatedDaysLeft - b.estimatedDaysLeft)[0]
                        : null
                    
                    if (criticalItem) {
                      setSelectedItem(criticalItem)
                      setShowRestockModal(true)
                    }
                  }}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nhập hàng ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {showOnlyProblems && (
          <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-bold text-red-900">
                  Đang hiển thị chỉ các mặt hàng có vấn đề
                </p>
                <p className="text-sm text-red-700">
                  {filteredInventory.length} mặt hàng cần nhập hàng
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
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
              placeholder="Tìm kiếm nguyên liệu, nhà cung cấp..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as StockStatus | 'all')}
              className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
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
                <th className="px-4 py-3 text-center">Tỷ lệ sử dụng</th>
                <th className="px-4 py-3 text-center">Dự kiến hết</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item) => {
                const statusInfo = getStatusInfo(item.status)
                const StatusIcon = statusInfo.icon
                const stockPercentage = (item.currentStock / item.maxStock) * 100
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category} • {item.supplier}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div>
                        <p className="font-bold text-gray-900">{item.currentStock} {item.unit}</p>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${
                              stockPercentage > 50 ? 'bg-green-500' :
                              stockPercentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <p className="text-sm text-gray-600">{item.minStock} {item.unit}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <p className="text-sm font-semibold text-gray-900">{item.usageRate} {item.unit}/ngày</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <p className={`text-sm font-bold ${
                        item.estimatedDaysLeft < 1 ? 'text-red-600' :
                        item.estimatedDaysLeft < 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {item.estimatedDaysLeft === 0 ? 'Hết hàng' : `${item.estimatedDaysLeft.toFixed(1)} ngày`}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleRestockClick(item)}
                          className="p-2 bg-[#AD2C00] text-white rounded-lg hover:bg-[#D83900] transition-colors"
                          title="Nhập hàng"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy nguyên liệu nào</p>
          </div>
        )}
      </div>

      {showRestockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedItem ? `Nhập Hàng: ${selectedItem.name}` : 'Chọn Nguyên Liệu Nhập Hàng'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedItem ? `Nhà cung cấp: ${selectedItem.supplier}` : 'Cập nhật tồn kho nguyên liệu'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRestockModal(false)
                  setSelectedItem(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!selectedItem ? (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700">
                    Chọn nguyên liệu cần nhập
                  </label>
                  <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                    {inventory.map((item) => {
                      const statusInfo = getStatusInfo(item.status)
                      const StatusIcon = statusInfo.icon
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-[#AD2C00] hover:bg-[#AD2C00]/5 transition-all text-left"
                        >
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              Tồn kho: {item.currentStock} {item.unit} • {item.category}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Tồn kho hiện tại
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedItem.currentStock} {selectedItem.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Mức tối thiểu
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedItem.minStock} {selectedItem.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Tỷ lệ sử dụng
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {selectedItem.usageRate} {selectedItem.unit}/ngày
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Dự kiến hết
                        </p>
                        <p className={`text-lg font-bold ${
                          selectedItem.estimatedDaysLeft < 1 ? 'text-red-600' :
                          selectedItem.estimatedDaysLeft < 3 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {selectedItem.estimatedDaysLeft === 0 ? 'Hết hàng' : `${selectedItem.estimatedDaysLeft.toFixed(1)} ngày`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Số lượng nhập <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={restockAmount}
                        onChange={(e) => setRestockAmount(e.target.value)}
                        placeholder={`Nhập số lượng (${selectedItem.unit})`}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                        min="0"
                        step="0.1"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                        {selectedItem.unit}
                      </span>
                    </div>
                    {restockAmount && parseFloat(restockAmount) > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          <span className="font-bold">Tồn kho sau nhập:</span>{' '}
                          {(selectedItem.currentStock + parseFloat(restockAmount)).toFixed(1)} {selectedItem.unit}
                          {' '}• Dự kiến đủ dùng{' '}
                          <span className="font-bold">
                            {((selectedItem.currentStock + parseFloat(restockAmount)) / selectedItem.usageRate).toFixed(1)} ngày
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Ghi chú
                    </label>
                    <textarea
                      value={restockNote}
                      onChange={(e) => setRestockNote(e.target.value)}
                      placeholder="Ghi chú về lô hàng, nhà cung cấp, giá cả..."
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-blue-900 mb-1">
                          Khuyến nghị nhập hàng
                        </p>
                        <p className="text-sm text-blue-700">
                          Để đảm bảo hoạt động liên tục, nên nhập tối thiểu{' '}
                          <span className="font-bold">
                            {Math.max(0, selectedItem.minStock - selectedItem.currentStock).toFixed(1)} {selectedItem.unit}
                          </span>
                          {' '}để đạt mức tồn kho an toàn.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      Chọn lại
                    </button>
                    <button
                      onClick={handleRestockSubmit}
                      disabled={!restockAmount || parseFloat(restockAmount) <= 0}
                      className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Xác Nhận Nhập Hàng
                    </button>
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
