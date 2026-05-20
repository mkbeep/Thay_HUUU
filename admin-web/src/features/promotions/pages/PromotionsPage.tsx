import { useState } from 'react'
import { Gift, Plus, Edit, Trash2, Search, Filter, Percent, DollarSign, Clock, Users, Copy, Eye, X } from 'lucide-react'

type PromotionType = 'percentage' | 'fixed' | 'buy-get' | 'combo'
type PromotionStatus = 'active' | 'inactive' | 'expired' | 'scheduled'

interface Promotion {
  id: number
  name: string
  code: string
  type: PromotionType
  value: number
  minOrderValue: number
  maxDiscount?: number
  startDate: string
  endDate: string
  usageLimit: number
  usedCount: number
  status: PromotionStatus
  description: string
  applicableItems?: string[]
  timeRestrictions?: {
    days: string[]
    startTime: string
    endTime: string
  }
}

export default function PromotionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<PromotionType | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<PromotionStatus | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  
  // Form states for creating/editing
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage' as PromotionType,
    value: '',
    minOrderValue: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    description: '',
    timeRestrictions: {
      enabled: false,
      days: [] as string[],
      startTime: '',
      endTime: ''
    }
  })

  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: 1,
      name: 'Giảm 20% Cuối Tuần',
      code: 'WEEKEND20',
      type: 'percentage',
      value: 20,
      minOrderValue: 200000,
      maxDiscount: 100000,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      usageLimit: 1000,
      usedCount: 234,
      status: 'active',
      description: 'Giảm 20% cho đơn hàng cuối tuần, tối đa 100k',
      timeRestrictions: {
        days: ['Saturday', 'Sunday'],
        startTime: '00:00',
        endTime: '23:59'
      }
    },
    {
      id: 2,
      name: 'Mừng Khai Trương',
      code: 'GRAND50',
      type: 'fixed',
      value: 50000,
      minOrderValue: 300000,
      startDate: '2026-04-15',
      endDate: '2026-05-15',
      usageLimit: 500,
      usedCount: 456,
      status: 'active',
      description: 'Giảm 50k cho đơn hàng từ 300k nhân dịp khai trương'
    },
    {
      id: 3,
      name: 'Mua 2 Tặng 1',
      code: 'BUY2GET1',
      type: 'buy-get',
      value: 1,
      minOrderValue: 0,
      startDate: '2026-05-01',
      endDate: '2026-05-07',
      usageLimit: 200,
      usedCount: 89,
      status: 'active',
      description: 'Mua 2 pizza bất kỳ tặng 1 pizza nhỏ'
    },
    {
      id: 4,
      name: 'Combo Sinh Viên',
      code: 'STUDENT15',
      type: 'percentage',
      value: 15,
      minOrderValue: 150000,
      maxDiscount: 50000,
      startDate: '2026-03-01',
      endDate: '2026-04-30',
      usageLimit: 300,
      usedCount: 300,
      status: 'expired',
      description: 'Giảm 15% cho sinh viên, tối đa 50k'
    },
    {
      id: 5,
      name: 'Flash Sale Giờ Vàng',
      code: 'FLASH30',
      type: 'percentage',
      value: 30,
      minOrderValue: 250000,
      maxDiscount: 150000,
      startDate: '2026-05-10',
      endDate: '2026-05-10',
      usageLimit: 100,
      usedCount: 0,
      status: 'scheduled',
      description: 'Flash sale 30% từ 18:00-20:00',
      timeRestrictions: {
        days: ['Friday'],
        startTime: '18:00',
        endTime: '20:00'
      }
    },
    {
      id: 6,
      name: 'Khách VIP',
      code: 'VIP25',
      type: 'percentage',
      value: 25,
      minOrderValue: 500000,
      maxDiscount: 200000,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      usageLimit: 10000,
      usedCount: 1234,
      status: 'inactive',
      description: 'Ưu đãi đặc biệt cho khách VIP'
    }
  ])

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'percentage',
      value: '',
      minOrderValue: '',
      maxDiscount: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      description: '',
      timeRestrictions: {
        enabled: false,
        days: [],
        startTime: '',
        endTime: ''
      }
    })
  }

  const handleCreatePromotion = () => {
    if (!formData.name || !formData.code || !formData.value || !formData.startDate || !formData.endDate || !formData.usageLimit) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    const newPromotion: Promotion = {
      id: Math.max(...promotions.map(p => p.id)) + 1,
      name: formData.name,
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: parseFloat(formData.value),
      minOrderValue: parseFloat(formData.minOrderValue) || 0,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      usageLimit: parseInt(formData.usageLimit),
      usedCount: 0,
      status: new Date(formData.startDate) > new Date() ? 'scheduled' : 'active',
      description: formData.description,
      timeRestrictions: formData.timeRestrictions.enabled ? {
        days: formData.timeRestrictions.days,
        startTime: formData.timeRestrictions.startTime,
        endTime: formData.timeRestrictions.endTime
      } : undefined
    }

    setPromotions([...promotions, newPromotion])
    setShowCreateModal(false)
    resetForm()
    alert('Tạo khuyến mãi thành công!')
  }

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      name: promotion.name,
      code: promotion.code,
      type: promotion.type,
      value: promotion.value.toString(),
      minOrderValue: promotion.minOrderValue.toString(),
      maxDiscount: promotion.maxDiscount?.toString() || '',
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      usageLimit: promotion.usageLimit.toString(),
      description: promotion.description,
      timeRestrictions: {
        enabled: !!promotion.timeRestrictions,
        days: promotion.timeRestrictions?.days || [],
        startTime: promotion.timeRestrictions?.startTime || '',
        endTime: promotion.timeRestrictions?.endTime || ''
      }
    })
    setShowCreateModal(true)
  }

  const handleUpdatePromotion = () => {
    if (!editingPromotion || !formData.name || !formData.code || !formData.value || !formData.startDate || !formData.endDate || !formData.usageLimit) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    const updatedPromotion: Promotion = {
      ...editingPromotion,
      name: formData.name,
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: parseFloat(formData.value),
      minOrderValue: parseFloat(formData.minOrderValue) || 0,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      usageLimit: parseInt(formData.usageLimit),
      description: formData.description,
      timeRestrictions: formData.timeRestrictions.enabled ? {
        days: formData.timeRestrictions.days,
        startTime: formData.timeRestrictions.startTime,
        endTime: formData.timeRestrictions.endTime
      } : undefined
    }

    setPromotions(promotions.map(p => p.id === editingPromotion.id ? updatedPromotion : p))
    setShowCreateModal(false)
    setEditingPromotion(null)
    resetForm()
    alert('Cập nhật khuyến mãi thành công!')
  }

  const handleDeletePromotion = (promotion: Promotion) => {
    if (confirm(`Bạn có chắc muốn xóa khuyến mãi "${promotion.name}"?`)) {
      setPromotions(promotions.filter(p => p.id !== promotion.id))
      alert('Xóa khuyến mãi thành công!')
    }
  }

  const handleViewDetail = (promotion: Promotion) => {
    setSelectedPromotion(promotion)
    setShowDetailModal(true)
  }

  const toggleDay = (day: string) => {
    const currentDays = formData.timeRestrictions.days
    const newDays = currentDays.includes(day) 
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day]
    
    setFormData({
      ...formData,
      timeRestrictions: {
        ...formData.timeRestrictions,
        days: newDays
      }
    })
  }

  const getTypeInfo = (type: PromotionType) => {
    switch (type) {
      case 'percentage':
        return { name: 'Giảm %', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Percent }
      case 'fixed':
        return { name: 'Giảm tiền', color: 'bg-green-100 text-green-700 border-green-200', icon: DollarSign }
      case 'buy-get':
        return { name: 'Mua-Tặng', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Gift }
      case 'combo':
        return { name: 'Combo', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Users }
    }
  }

  const getStatusInfo = (status: PromotionStatus) => {
    switch (status) {
      case 'active':
        return { name: 'Đang chạy', color: 'bg-green-100 text-green-700 border-green-200' }
      case 'inactive':
        return { name: 'Tạm dừng', color: 'bg-gray-100 text-gray-700 border-gray-200' }
      case 'expired':
        return { name: 'Hết hạn', color: 'bg-red-100 text-red-700 border-red-200' }
      case 'scheduled':
        return { name: 'Chờ chạy', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert(`Đã copy mã: ${code}`)
  }

  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         promo.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || promo.type === selectedType
    const matchesStatus = selectedStatus === 'all' || promo.status === selectedStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => p.status === 'active').length,
    totalUsage: promotions.reduce((sum, p) => sum + p.usedCount, 0),
    totalSavings: promotions.reduce((sum, p) => {
      if (p.type === 'percentage') {
        return sum + (p.usedCount * (p.maxDiscount || 0))
      } else if (p.type === 'fixed') {
        return sum + (p.usedCount * p.value)
      }
      return sum
    }, 0)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Khuyến Mãi & Voucher
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý mã giảm giá và chương trình khuyến mãi
          </p>
        </div>
        
        <button 
          onClick={() => {
            resetForm()
            setEditingPromotion(null)
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Tạo Khuyến Mãi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Tổng khuyến mãi</p>
            <Gift className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Đang quản lý</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl shadow-sm border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">Đang chạy</p>
            <Eye className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">{stats.active}</p>
          <p className="text-xs text-green-600 mt-1">Khuyến mãi hoạt động</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl shadow-sm border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-purple-700 uppercase tracking-wider">Lượt sử dụng</p>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900">{stats.totalUsage.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-purple-600 mt-1">Tổng lượt dùng</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl shadow-sm border border-orange-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-orange-700 uppercase tracking-wider">Tiết kiệm</p>
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(stats.totalSavings)}</p>
          <p className="text-xs text-orange-600 mt-1">Cho khách hàng</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
              placeholder="Tìm kiếm khuyến mãi, mã voucher..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as PromotionType | 'all')}
              className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
            >
              <option value="all">Tất cả loại</option>
              <option value="percentage">Giảm %</option>
              <option value="fixed">Giảm tiền</option>
              <option value="buy-get">Mua-Tặng</option>
              <option value="combo">Combo</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PromotionStatus | 'all')}
              className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang chạy</option>
              <option value="inactive">Tạm dừng</option>
              <option value="scheduled">Chờ chạy</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="px-4 py-3 text-left">Khuyến mãi</th>
                <th className="px-4 py-3 text-center">Loại</th>
                <th className="px-4 py-3 text-center">Giá trị</th>
                <th className="px-4 py-3 text-center">Thời gian</th>
                <th className="px-4 py-3 text-center">Sử dụng</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPromotions.map((promo) => {
                const typeInfo = getTypeInfo(promo.type)
                const statusInfo = getStatusInfo(promo.status)
                const TypeIcon = typeInfo.icon
                const usagePercent = (promo.usedCount / promo.usageLimit) * 100
                
                return (
                  <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold text-gray-900">{promo.name}</p>
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-mono hover:bg-gray-200 transition-colors"
                          >
                            {promo.code}
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">{promo.description}</p>
                        {promo.timeRestrictions && (
                          <p className="text-xs text-blue-600 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {promo.timeRestrictions.days.join(', ')} • {promo.timeRestrictions.startTime}-{promo.timeRestrictions.endTime}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${typeInfo.color}`}>
                        <TypeIcon className="w-3.5 h-3.5" />
                        {typeInfo.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div>
                        <p className="font-bold text-gray-900">
                          {promo.type === 'percentage' ? `${promo.value}%` : 
                           promo.type === 'fixed' ? formatCurrency(promo.value) :
                           promo.type === 'buy-get' ? `Mua 2 tặng ${promo.value}` : 'Combo'}
                        </p>
                        {promo.minOrderValue > 0 && (
                          <p className="text-xs text-gray-500">
                            Tối thiểu {formatCurrency(promo.minOrderValue)}
                          </p>
                        )}
                        {promo.maxDiscount && (
                          <p className="text-xs text-gray-500">
                            Tối đa {formatCurrency(promo.maxDiscount)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(promo.startDate)}
                        </p>
                        <p className="text-xs text-gray-500">đến</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(promo.endDate)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {promo.usedCount.toLocaleString('vi-VN')} / {promo.usageLimit.toLocaleString('vi-VN')}
                        </p>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1">
                          <div
                            className={`h-full rounded-full ${
                              usagePercent > 80 ? 'bg-red-500' :
                              usagePercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {usagePercent.toFixed(1)}% đã dùng
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                          {statusInfo.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleViewDetail(promo)}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditPromotion(promo)}
                          className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePromotion(promo)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredPromotions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy khuyến mãi nào</p>
          </div>
        )}
      </div>

      {/* Modal Tạo Khuyến Mãi */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingPromotion ? 'Chỉnh Sửa Khuyến Mãi' : 'Tạo Khuyến Mãi Mới'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingPromotion ? 'Cập nhật thông tin khuyến mãi' : 'Thiết lập chương trình khuyến mãi cho khách hàng'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingPromotion(null)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Tên khuyến mãi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Giảm 20% cuối tuần"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Mã voucher <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="VD: WEEKEND20"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Loại khuyến mãi <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { type: 'percentage', name: 'Giảm %', desc: 'Giảm theo phần trăm', icon: Percent },
                    { type: 'fixed', name: 'Giảm tiền', desc: 'Giảm số tiền cố định', icon: DollarSign },
                    { type: 'buy-get', name: 'Mua-Tặng', desc: 'Mua X tặng Y', icon: Gift },
                    { type: 'combo', name: 'Combo', desc: 'Combo đặc biệt', icon: Users }
                  ].map((item) => {
                    const Icon = item.icon
                    const isSelected = formData.type === item.type
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setFormData({...formData, type: item.type as PromotionType})}
                        className={`p-4 border-2 rounded-xl transition-all text-left group ${
                          isSelected 
                            ? 'border-[#AD2C00] bg-[#AD2C00]/5' 
                            : 'border-gray-200 hover:border-[#AD2C00] hover:bg-[#AD2C00]/5'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${
                          isSelected ? 'text-[#AD2C00]' : 'text-gray-600 group-hover:text-[#AD2C00]'
                        }`} />
                        <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                      placeholder="20"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                      {formData.type === 'percentage' ? '%' : formData.type === 'fixed' ? 'VND' : formData.type === 'buy-get' ? 'món' : 'combo'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Đơn hàng tối thiểu
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({...formData, minOrderValue: e.target.value})}
                    placeholder="200000"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Giảm tối đa
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                    placeholder="100000"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Giới hạn sử dụng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  placeholder="1000"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all resize-none"
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="timeRestrictions"
                    checked={formData.timeRestrictions.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      timeRestrictions: {
                        ...formData.timeRestrictions,
                        enabled: e.target.checked
                      }
                    })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="timeRestrictions" className="font-bold text-blue-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Giới hạn thời gian (Tùy chọn)
                  </label>
                </div>
                
                {formData.timeRestrictions.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-blue-700 uppercase">
                        Ngày trong tuần
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'Monday', label: 'T2' },
                          { key: 'Tuesday', label: 'T3' },
                          { key: 'Wednesday', label: 'T4' },
                          { key: 'Thursday', label: 'T5' },
                          { key: 'Friday', label: 'T6' },
                          { key: 'Saturday', label: 'T7' },
                          { key: 'Sunday', label: 'CN' }
                        ].map((day) => (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => toggleDay(day.key)}
                            className={`px-3 py-1 text-xs font-bold border-2 rounded-lg transition-colors ${
                              formData.timeRestrictions.days.includes(day.key)
                                ? 'border-blue-500 bg-blue-100 text-blue-700'
                                : 'border-blue-200 text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-blue-700 uppercase">
                        Giờ bắt đầu
                      </label>
                      <input
                        type="time"
                        value={formData.timeRestrictions.startTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          timeRestrictions: {
                            ...formData.timeRestrictions,
                            startTime: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 bg-white border-2 border-blue-200 rounded-lg text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-blue-700 uppercase">
                        Giờ kết thúc
                      </label>
                      <input
                        type="time"
                        value={formData.timeRestrictions.endTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          timeRestrictions: {
                            ...formData.timeRestrictions,
                            endTime: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 bg-white border-2 border-blue-200 rounded-lg text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingPromotion(null)
                    resetForm()
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="button"
                  onClick={editingPromotion ? handleUpdatePromotion : handleCreatePromotion}
                  className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5" />
                  {editingPromotion ? 'Cập Nhật Khuyến Mãi' : 'Tạo Khuyến Mãi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Chi Tiết */}
      {showDetailModal && selectedPromotion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chi Tiết Khuyến Mãi</h2>
                <p className="text-sm text-gray-500 mt-1">Thông tin đầy đủ về chương trình khuyến mãi</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedPromotion(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thông Tin Cơ Bản</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Tên khuyến mãi</p>
                        <p className="text-lg font-bold text-gray-900">{selectedPromotion.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Mã voucher</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-mono font-bold text-[#AD2C00]">{selectedPromotion.code}</p>
                          <button
                            onClick={() => copyCode(selectedPromotion.code)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Loại khuyến mãi</p>
                        <div className="mt-1">
                          {(() => {
                            const typeInfo = getTypeInfo(selectedPromotion.type)
                            const TypeIcon = typeInfo.icon
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${typeInfo.color}`}>
                                <TypeIcon className="w-4 h-4" />
                                {typeInfo.name}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Trạng thái</p>
                        <div className="mt-1">
                          {(() => {
                            const statusInfo = getStatusInfo(selectedPromotion.status)
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${statusInfo.color}`}>
                                {statusInfo.name}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Giá Trị & Điều Kiện</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Giá trị giảm</p>
                        <p className="text-2xl font-bold text-[#AD2C00]">
                          {selectedPromotion.type === 'percentage' ? `${selectedPromotion.value}%` : 
                           selectedPromotion.type === 'fixed' ? formatCurrency(selectedPromotion.value) :
                           selectedPromotion.type === 'buy-get' ? `Mua 2 tặng ${selectedPromotion.value}` : 'Combo đặc biệt'}
                        </p>
                      </div>
                      {selectedPromotion.minOrderValue > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Đơn hàng tối thiểu</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedPromotion.minOrderValue)}</p>
                        </div>
                      )}
                      {selectedPromotion.maxDiscount && (
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Giảm tối đa</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedPromotion.maxDiscount)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Thời Gian Áp Dụng</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Thời gian</p>
                      <p className="text-gray-900">
                        {formatDate(selectedPromotion.startDate)} - {formatDate(selectedPromotion.endDate)}
                      </p>
                    </div>
                    {selectedPromotion.timeRestrictions && (
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Giới hạn thời gian</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedPromotion.timeRestrictions.days.map(day => (
                            <span key={day} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                              {day === 'Monday' ? 'T2' : day === 'Tuesday' ? 'T3' : day === 'Wednesday' ? 'T4' : 
                               day === 'Thursday' ? 'T5' : day === 'Friday' ? 'T6' : day === 'Saturday' ? 'T7' : 'CN'}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedPromotion.timeRestrictions.startTime} - {selectedPromotion.timeRestrictions.endTime}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Thống Kê Sử Dụng</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Lượt sử dụng</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedPromotion.usedCount.toLocaleString('vi-VN')} / {selectedPromotion.usageLimit.toLocaleString('vi-VN')}
                      </p>
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                        <div
                          className={`h-full rounded-full ${
                            (selectedPromotion.usedCount / selectedPromotion.usageLimit) * 100 > 80 ? 'bg-red-500' :
                            (selectedPromotion.usedCount / selectedPromotion.usageLimit) * 100 > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((selectedPromotion.usedCount / selectedPromotion.usageLimit) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {((selectedPromotion.usedCount / selectedPromotion.usageLimit) * 100).toFixed(1)}% đã sử dụng
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPromotion.description && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Mô Tả</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedPromotion.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    handleEditPromotion(selectedPromotion)
                  }}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Chỉnh Sửa
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setSelectedPromotion(null)
                  }}
                  className="flex-1 px-6 py-3 bg-[#AD2C00] text-white rounded-xl font-bold hover:bg-[#D83900] transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
