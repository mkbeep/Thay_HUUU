import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Upload,
  PlusCircle,
  ImageIcon
} from 'lucide-react'
import { MenuService } from '../../../business/services/MenuService'
import { MenuCategory } from '../../../domain/models/MenuItem'

// Types
interface Topping {
  id: string
  name: string
  price: number
  mandatory: boolean
}

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  description: string
  imageUrl: string
  imageFile?: File
  removeImage?: boolean
  inStock: boolean
  toppings: Topping[]
}

const categories = Object.values(MenuCategory)

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set())
  const [brokenImageKeys, setBrokenImageKeys] = useState<Set<string>>(new Set())
  const [showDrawer, setShowDrawer] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    category: 'Khai vị',
    price: 0,
    description: '',
    imageUrl: '',
    removeImage: false,
    inStock: true,
    toppings: []
  })

  const menuService = useMemo(() => new MenuService(), [])

  // Load menu items from API
  useEffect(() => {
    loadMenuItems()
  }, [])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      setLoadError('')
      console.log('Loading menu items...')
      const items = await menuService.getMenuItems()
      console.log('Menu items loaded:', items)
      
      // Map from domain model to local interface
      const mappedItems: MenuItem[] = items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        description: item.description,
        imageUrl: item.imageUrl || '',
        inStock: item.available,
        toppings: [] // Topping sẽ được xử lý sau
      }))
      
      console.log('Mapped items:', mappedItems)
      setMenuItems(mappedItems)
    } catch (error) {
      console.error('Error loading menu items:', error)
      if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data)
        console.error('Status:', error.response?.status)
      }
      setLoadError('Không thể tải dữ liệu menu từ API. Kiểm tra backend/Firebase rồi tải lại.')
      setMenuItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData(item)
    setShowDrawer(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      category: 'Khai vị',
      price: 0,
      description: '',
      imageUrl: '',
      removeImage: false,
      inStock: true,
      toppings: []
    })
    setShowDrawer(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa món này?')) {
      const previousItems = menuItems
      setMenuItems(previousItems.filter(item => item.id !== id))
      const success = await menuService.deleteMenuItem(id)
      if (!success) {
        setMenuItems(previousItems)
        alert('Không thể xóa món ăn')
      }
    }
  }

  const handleToggleStock = async (id: string) => {
    const currentItem = menuItems.find(item => item.id === id)
    if (!currentItem || pendingToggleIds.has(id)) return

    setPendingToggleIds(prev => new Set(prev).add(id))
    setMenuItems(items => items.map(item => 
      item.id === id ? { ...item, inStock: !item.inStock } : item
    ))

    try {
      const updatedItem = await menuService.updateMenuItem(id, {
        available: !currentItem.inStock,
      })
      if (!updatedItem) throw new Error('No updated item returned')
    } catch (error) {
      console.error('Error toggling stock:', error)
      setMenuItems(items => items.map(item => 
        item.id === id ? { ...item, inStock: currentItem.inStock } : item
      ))
      alert('Không thể cập nhật trạng thái món ăn')
    } finally {
      setPendingToggleIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleSave = async () => {
    const snapshot = menuItems
    const nextName = formData.name?.trim() || ''
    const nextDescription = formData.description || ''
    const nextCategory = formData.category || editingItem?.category || 'Khai vị'
    const nextPrice = Number(formData.price) || 0
    const nextImageUrl = formData.imageUrl || ''

    try {
      setSaving(true)
      setShowDrawer(false)

      if (editingItem) {
        const optimisticItem: MenuItem = {
          ...editingItem,
          name: nextName,
          description: nextDescription,
          category: nextCategory,
          price: nextPrice,
          imageUrl: nextImageUrl,
          inStock: formData.inStock ?? editingItem.inStock,
          removeImage: formData.removeImage,
          imageFile: formData.imageFile,
          toppings: formData.toppings || [],
        }

        setMenuItems(items => items.map(item =>
          item.id === editingItem.id ? optimisticItem : item
        ))
        setBrokenImageKeys(prev => {
          const next = new Set(prev)
          next.delete(`${editingItem.id}:${nextImageUrl}`)
          return next
        })

        const updated = await menuService.updateMenuItem(editingItem.id, {
          name: nextName,
          description: nextDescription,
          category: nextCategory as MenuCategory,
          price: nextPrice,
          imageFile: formData.imageFile,
          removeImage: formData.removeImage,
        })
        if (!updated) throw new Error('Update failed')

        setMenuItems(items => items.map(item => 
          item.id === editingItem.id
            ? {
              ...item,
              name: updated.name,
              category: updated.category,
              price: updated.price,
              description: updated.description,
              imageUrl: updated.imageUrl || nextImageUrl,
              inStock: updated.available,
            }
            : item
        ))
      } else {
        const tempId = `temp-${Date.now()}`
        const optimisticItem: MenuItem = {
          id: tempId,
          name: nextName,
          description: nextDescription,
          category: nextCategory,
          price: nextPrice,
          imageUrl: nextImageUrl,
          inStock: true,
          toppings: formData.toppings || [],
        }

        setMenuItems(items => [...items, optimisticItem])

        const created = await menuService.createMenuItem({
          name: nextName,
          description: nextDescription,
          category: nextCategory as MenuCategory,
          price: nextPrice,
          imageFile: formData.imageFile,
        })

        setMenuItems(items => items.map(item =>
          item.id === tempId
            ? {
              id: created.id,
              name: created.name,
              category: created.category,
              price: created.price,
              description: created.description,
              imageUrl: created.imageUrl || nextImageUrl,
              inStock: created.available,
              toppings: [],
            }
            : item
        ))
      }
    } catch (error) {
      console.error('Error saving menu item:', error)
      setMenuItems(snapshot)
      alert('Không thể lưu món ăn')
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = (file?: File) => {
    if (!file) return
    setFormData({
      ...formData,
      imageFile: file,
      imageUrl: URL.createObjectURL(file),
      removeImage: false,
    })
  }

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      imageFile: undefined,
      imageUrl: '',
      removeImage: true,
    })
  }

  const handleAddTopping = () => {
    const newTopping: Topping = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      mandatory: false
    }
    setFormData({
      ...formData,
      toppings: [...(formData.toppings || []), newTopping]
    })
  }

  const handleRemoveTopping = (toppingId: string) => {
    setFormData({
      ...formData,
      toppings: formData.toppings?.filter(t => t.id !== toppingId)
    })
  }

  const handleToppingChange = (toppingId: string, field: keyof Topping, value: any) => {
    setFormData({
      ...formData,
      toppings: formData.toppings?.map(t => 
        t.id === toppingId ? { ...t, [field]: value } : t
      )
    })
  }

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  const markImageBroken = (item: MenuItem) => {
    if (!item.imageUrl) return
    setBrokenImageKeys(prev => new Set(prev).add(`${item.id}:${item.imageUrl}`))
  }

  const isImageBroken = (item: MenuItem) => (
    item.imageUrl ? brokenImageKeys.has(`${item.id}:${item.imageUrl}`) : true
  )

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Quản Lý Menu</h1>
          <p className="text-gray-600 font-medium">
            Quản lý món ăn và tùy chỉnh thực đơn của bạn.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-gradient-to-r from-[#AD2C00] to-[#D83900] text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-[#AD2C00]/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Thêm Món Mới
        </button>
      </div>

      {/* Menu Sections */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#AD2C00]"></div>
            <p className="mt-4 text-gray-600 font-medium">Đang tải menu...</p>
          </div>
        </div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-600 font-medium">
            {loadError || 'Chưa có món ăn nào'}
          </p>
          {loadError && (
            <button
              onClick={loadMenuItems}
              className="mt-4 px-5 py-2 rounded-lg bg-[#AD2C00] text-white font-bold hover:brightness-110"
            >
              Tải lại
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-16">
          {Object.entries(groupedItems).map(([category, items]) => (
          <section key={category}>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
              <div className="h-[2px] flex-1 bg-[#E5E2E1] rounded-full"></div>
              <span className="text-sm font-bold text-[#AD2C00] px-3 py-1 bg-[#FFDBD1] rounded-full">
                {items.length.toString().padStart(2, '0')} Món
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg overflow-hidden flex flex-col group transition-all hover:-translate-y-1 ${
                    !item.inStock ? 'opacity-75 grayscale' : ''
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-48 w-full overflow-hidden">
                    {isImageBroken(item) ? (
                      <div className="w-full h-full bg-[#E5E2E1] flex items-center justify-center text-[#916F67]">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    ) : (
                      <img
                        key={`${item.id}:${item.imageUrl}`}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        src={item.imageUrl}
                        onError={() => markImageBroken(item)}
                      />
                    )}
                    <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur text-[#AD2C00] font-bold rounded-full text-sm">
                      {item.price.toLocaleString('vi-VN')}₫
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={item.inStock}
                          disabled={pendingToggleIds.has(item.id)}
                          onChange={() => handleToggleStock(item.id)}
                        />
                        <div className="w-11 h-6 bg-[#E5E2E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006A35]"></div>
                      </label>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-6">
                      {item.description}
                    </p>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-widest ${
                        item.inStock ? 'text-[#006A35]' : 'text-[#BA1A1A]'
                      }`}>
                        {item.inStock ? 'Còn Hàng' : 'Hết Hàng'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E5E2E1] text-[#5F5E5E] hover:bg-orange-100 hover:text-[#AD2C00] transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E5E2E1] text-[#5F5E5E] hover:bg-[#FFDAD6] hover:text-[#BA1A1A] transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      )}

      {/* Slide-over Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 bg-[#1C1B1B]/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-8 flex items-center justify-between border-b border-[#E5E2E1]">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingItem ? 'Chỉnh Sửa Món' : 'Thêm Món Mới'}
                </h2>
                <p className="text-gray-600 text-sm">
                  Cập nhật thông tin món ăn và topping
                </p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#E5E2E1] transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 space-y-8 pb-10 pt-8">
              {/* Image Upload */}
              <label className="relative w-full aspect-video bg-[#E5E2E1] rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-[#916F67]/50 group cursor-pointer hover:bg-orange-50/30 hover:border-[#AD2C00]/50 transition-all overflow-hidden">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Ảnh món ăn" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-600 mb-2 group-hover:text-[#AD2C00]" />
                    <p className="text-sm font-bold text-gray-700 group-hover:text-[#AD2C00]">
                      Click để tải ảnh món ăn
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                      JPG, PNG tối đa 5MB
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleImageChange(event.target.files?.[0])}
                />
              </label>
              {formData.imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-sm font-bold text-[#BA1A1A] hover:underline"
                >
                  Xóa ảnh hiện tại
                </button>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
                    Tên Món
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#F6F3F2] border-none rounded-sm px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00]/20 outline-none"
                    placeholder="Nhập tên món ăn"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
                    Danh Mục
                  </label>
                  <select
                    className="w-full bg-[#F6F3F2] border-none rounded-sm px-4 py-3 text-gray-900 focus:ring-2 focus:ring-[#AD2C00]/20 outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
                    Giá (₫)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-[#F6F3F2] border-none rounded-sm px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00]/20 outline-none"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
                    Mô Tả
                  </label>
                  <textarea
                    className="w-full bg-[#F6F3F2] border-none rounded-sm px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00]/20 outline-none"
                    rows={3}
                    placeholder="Mô tả món ăn..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Topping Configuration */}
              <div className="pt-6 border-t border-[#E5E2E1]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-gray-900">Cấu Hình Topping</h3>
                  <button
                    onClick={handleAddTopping}
                    className="text-[#AD2C00] text-sm font-bold flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Thêm Dòng
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.toppings?.map((topping) => (
                    <div
                      key={topping.id}
                      className="grid grid-cols-[1fr,100px,80px,40px] items-center gap-4 p-4 bg-[#F6F3F2] rounded-lg"
                    >
                      <input
                        type="text"
                        className="bg-white border-none rounded-sm text-sm px-3 py-2 text-gray-900 placeholder:text-gray-500 outline-none"
                        placeholder="Tên topping"
                        value={topping.name}
                        onChange={(e) => handleToppingChange(topping.id, 'name', e.target.value)}
                      />
                      <input
                        type="number"
                        className="bg-white border-none rounded-sm text-sm px-3 py-2 text-gray-900 placeholder:text-gray-500 outline-none"
                        placeholder="+ 0₫"
                        value={topping.price}
                        onChange={(e) => handleToppingChange(topping.id, 'price', parseFloat(e.target.value))}
                      />
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] uppercase font-bold text-[#916F67] mb-1">
                          Bắt buộc
                        </span>
                        <input
                          type="checkbox"
                          className="rounded border-[#916F67] text-[#AD2C00] focus:ring-[#AD2C00]"
                          checked={topping.mandatory}
                          onChange={(e) => handleToppingChange(topping.id, 'mandatory', e.target.checked)}
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveTopping(topping.id)}
                        className="text-[#5F5E5E] hover:text-[#BA1A1A]"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-[#F6F3F2] flex gap-4 border-t border-[#E5E2E1]">
              <button
                onClick={() => setShowDrawer(false)}
                className="flex-1 bg-[#E5E2E1] text-gray-900 py-4 rounded-xl font-bold transition-all active:scale-98 hover:bg-[#DCD9D9]"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] bg-gradient-to-r from-[#AD2C00] to-[#D83900] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#AD2C00]/30 transition-all active:scale-98 hover:brightness-110"
              >
                {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
