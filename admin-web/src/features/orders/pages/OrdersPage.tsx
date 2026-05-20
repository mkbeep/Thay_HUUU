import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ChefHat, Clock } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { socketService } from '../../../services/socketService'

type KitchenStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served'
type PaymentStatus = 'unpaid' | 'payment_pending_confirmation' | 'paid'
const ACTIVE_STATUSES = new Set<KitchenStatus>(['pending', 'confirmed', 'preparing', 'ready', 'served'])

interface ApiOrderItem {
  id: string
  quantity: number
  food?: { name?: string } | null
}

interface ApiOrder {
  id: string
  order_number: string
  table_session_id?: string
  table_number?: string | number
  status: KitchenStatus
  payment_status?: PaymentStatus
  created_at: string
  items?: ApiOrderItem[]
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const client = axios.create({ baseURL: API_URL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.method?.toLowerCase() === 'get') {
    config.params = { ...(config.params || {}), _t: Date.now() }
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    config.headers.Pragma = 'no-cache'
    config.headers.Expires = '0'
  }
  return config
})

function getTableDisplay(order: ApiOrder): string {
  const tableNumber = order.table_number
  if (tableNumber !== undefined && tableNumber !== null && String(tableNumber).trim() !== '') {
    return String(tableNumber)
  }

  const fallback = order.table_session_id
  if (fallback && /^[A-Za-z]?\d{1,4}$/i.test(fallback.trim())) return fallback.trim()
  return 'N/A'
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const logout = useAuthStore((state) => state.logout)
  const authFailedRef = useRef(false)

  const handleUnauthorized = useCallback(() => {
    if (authFailedRef.current) return
    authFailedRef.current = true
    logout()
    socketService.disconnect()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const loadOrders = useCallback(async (showLoading = false) => {
    if (authFailedRef.current) return
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      if (!token) {
        handleUnauthorized()
        return
      }

      if (showLoading) setLoading(true)
      const response = await client.get('/orders')
      const allOrders = (response.data?.data || []) as ApiOrder[]
      const uniqueById = Array.from(new Map(allOrders.map((o: ApiOrder) => [o.id, o])).values())
        .filter((o): o is ApiOrder => ACTIVE_STATUSES.has(o.status))
      
      // ✅ TỰ ĐỘNG XÓA CÁC ĐƠN ĐÃ THANH TOÁN
      const unpaidOrders = uniqueById.filter((o: ApiOrder) => o.payment_status !== 'paid')
      
      if (unpaidOrders.length < uniqueById.length) {
        console.log(`🧹 Admin: Auto-removed ${uniqueById.length - unpaidOrders.length} paid order(s)`)
      }
      
      setOrders(unpaidOrders)
      if (isInitialLoad) setIsInitialLoad(false)
    } catch (error) {
      console.error('Error loading orders:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleUnauthorized()
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [handleUnauthorized, isInitialLoad])

  useEffect(() => {
    void loadOrders(true)
    
    // ✅ Lắng nghe WebSocket events để cập nhật real-time
    const socket = (window as any).socket
    if (socket) {
      const handleOrderUpdated = (data: any) => {
        console.log('📢 Order updated via WebSocket:', data)
        // Nếu order được thanh toán → Xóa ngay khỏi UI
        if (data.payment_status === 'paid') {
          setOrders((prev) => prev.filter((o) => o.id !== data.id))
          console.log(`🧹 Auto-removed paid order ${data.id} via WebSocket`)
        } else {
          // Reload để cập nhật trạng thái
          void loadOrders(false)
        }
      }
      
      socket.on('order:updated', handleOrderUpdated)
      socket.on('order:status_changed', handleOrderUpdated)
      
      // Cleanup
      return () => {
        socket.off('order:updated', handleOrderUpdated)
        socket.off('order:status_changed', handleOrderUpdated)
      }
    }
    
    // Chỉ poll khi tab đang active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadOrders(false)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Giảm interval xuống 3 giây để nhanh hơn
    const timer = setInterval(() => {
      if (!document.hidden) {
        void loadOrders(false)
      }
    }, 3000)
    
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadOrders])

  const updateStatus = async (id: string, status: KitchenStatus) => {
    try {
      console.log('Updating order status:', { id, status })
      const response = await client.patch(`/orders/${id}/status`, { status })
      console.log('Update response:', response.data)
      await loadOrders(false) // Không hiện loading khi update
    } catch (error) {
      console.error('Error updating status:', error)
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message
        alert(`Không thể cập nhật trạng thái: ${message}`)
      } else {
        alert('Không thể cập nhật trạng thái. Vui lòng thử lại.')
      }
    }
  }

  const confirmPayment = async (id: string) => {
    try {
      // ✅ XÓA NGAY KHỎI UI TRƯỚC (Optimistic UI)
      setOrders((prev) => prev.filter((o) => o.id !== id))
      console.log(`🧹 Admin: Removed paid order ${id} from UI (optimistic)`)
      
      // Gọi API ở background
      await client.patch(`/orders/${id}/confirm-payment`)
      console.log(`✅ Payment confirmed on server: ${id}`)
      
      // Reload để đồng bộ (trong trường hợp có lỗi)
      await loadOrders(false)
    } catch (error) {
      console.error('Error confirming payment:', error)
      alert('Không thể xác nhận thanh toán. Vui lòng thử lại.')
      // Reload lại để restore nếu có lỗi
      await loadOrders(false)
    }
  }

  // Helper function để lấy màu badge trạng thái
  const getStatusBadge = (status: KitchenStatus) => {
    const badges = {
      pending: { text: 'Đơn mới', color: 'bg-orange-100 text-orange-700 border-orange-200' },
      confirmed: { text: 'Đã nhận', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      preparing: { text: 'Đang nấu', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      ready: { text: 'Sẵn sàng', color: 'bg-green-100 text-green-700 border-green-200' },
      served: { text: 'Đã phục vụ', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    }
    return badges[status] || { text: status, color: 'bg-gray-100 text-gray-700 border-gray-200' }
  }

  // Helper function để lấy màu badge thanh toán
  const getPaymentBadge = (paymentStatus?: PaymentStatus) => {
    const badges = {
      unpaid: { text: 'Chưa thanh toán', color: 'bg-red-100 text-red-700 border-red-200' },
      payment_pending_confirmation: { text: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      paid: { text: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    }
    return badges[paymentStatus || 'unpaid'] || { text: 'Chưa thanh toán', color: 'bg-gray-100 text-gray-700 border-gray-200' }
  }

  const group = useMemo(() => {
    const by = (status: KitchenStatus) => orders.filter((o) => o.status === status)
    return {
      pending: by('pending'),
      confirmed: by('confirmed'),
      preparing: by('preparing'),
      ready: by('ready'),
      served: by('served'),
    }
  }, [orders])

  const renderCard = (order: ApiOrder, actions: JSX.Element) => {
    const statusBadge = getStatusBadge(order.status)
    const paymentBadge = getPaymentBadge(order.payment_status)
    
    return (
      <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="text-xs font-bold text-[#AD2C00] mb-1">{order.order_number || order.id}</div>
            {/* Số bàn với badge nổi bật */}
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-indigo-600">🪑 Bàn</span>
              <span className="text-sm font-bold text-indigo-700">{getTableDisplay(order)}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString('vi-VN')}</div>
        </div>

        {/* Badges trạng thái */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-xs font-medium px-2 py-1 rounded border ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded border ${paymentBadge.color}`}>
            {paymentBadge.text}
          </span>
        </div>

        {/* Danh sách món */}
        <div className="space-y-1 mb-3">
          {(order.items || []).slice(0, 3).map((item) => (
            <div key={item.id} className="text-sm text-gray-700">
              <span className="font-semibold text-[#AD2C00]">{item.quantity}x</span> {item.food?.name || 'Món ăn'}
            </div>
          ))}
          {(order.items || []).length > 3 && (
            <div className="text-xs text-gray-500 italic">
              +{(order.items || []).length - 3} món khác...
            </div>
          )}
        </div>

        <div>{actions}</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-orange-700">Vận hành đơn hàng (real-time)</h1>
          {!isInitialLoad && !loading && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Tự động cập nhật mỗi 8s
            </span>
          )}
        </div>
        <button 
          onClick={() => void loadOrders(true)} 
          disabled={loading}
          className="px-4 py-2 rounded bg-[#AD2C00] text-white text-sm hover:bg-[#8B2300] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {isInitialLoad && loading && <div className="text-sm text-gray-500 mb-4">Đang tải dữ liệu...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <section>
          <h3 className="font-bold mb-3 flex items-center gap-2">
            Đơn mới 
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
              {group.pending.length}
            </span>
          </h3>
          <div className="space-y-3">
            {group.pending.map((o) =>
              renderCard(
                o,
                <button onClick={() => void updateStatus(o.id, 'confirmed')} className="w-full py-2 rounded bg-[#AD2C00] text-white text-sm hover:bg-[#8B2300] transition-colors">
                  <Clock className="inline w-4 h-4 mr-1" />
                  Bếp nhận đơn
                </button>
              )
            )}
          </div>
        </section>

        <section>
          <h3 className="font-bold mb-3 flex items-center gap-2">
            Đã nhận
            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
              {group.confirmed.length}
            </span>
          </h3>
          <div className="space-y-3">
            {group.confirmed.map((o) =>
              renderCard(
                o,
                <button onClick={() => void updateStatus(o.id, 'preparing')} className="w-full py-2 rounded bg-[#5F5E5E] text-white text-sm hover:bg-[#4A4949] transition-colors">
                  <ChefHat className="inline w-4 h-4 mr-1" />
                  Bắt đầu nấu
                </button>
              )
            )}
          </div>
        </section>

        <section>
          <h3 className="font-bold mb-3 flex items-center gap-2">
            Đang nấu
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full">
              {group.preparing.length}
            </span>
          </h3>
          <div className="space-y-3">
            {group.preparing.map((o) =>
              renderCard(
                o,
                <button onClick={() => void updateStatus(o.id, 'ready')} className="w-full py-2 rounded bg-[#006A35] text-white text-sm hover:bg-[#005028] transition-colors">
                  Đánh dấu sẵn sàng
                </button>
              )
            )}
          </div>
        </section>

        <section>
          <h3 className="font-bold mb-3 flex items-center gap-2">
            Sẵn sàng
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
              {group.ready.length}
            </span>
          </h3>
          <div className="space-y-3">
            {group.ready.map((o) =>
              renderCard(
                o,
                <button onClick={() => void updateStatus(o.id, 'served')} className="w-full py-2 rounded bg-[#1D4ED8] text-white text-sm hover:bg-[#1E40AF] transition-colors">
                  Đã phục vụ
                </button>
              )
            )}
          </div>
        </section>

        <section>
          <h3 className="font-bold mb-3 flex items-center gap-2">
            Đã phục vụ
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
              {group.served.length}
            </span>
          </h3>
          <div className="space-y-3">
            {group.served.map((o) =>
              renderCard(
                o,
                o.payment_status === 'payment_pending_confirmation' ? (
                  <button onClick={() => void confirmPayment(o.id)} className="w-full py-2 rounded bg-[#006A35] text-white text-sm hover:bg-[#005028] transition-colors">
                    <CheckCircle className="inline w-4 h-4 mr-1" />
                    Xác nhận đã thanh toán
                  </button>
                ) : o.payment_status === 'paid' ? (
                  <div className="text-xs text-center py-2 px-3 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-medium">
                    ✅ Hoàn tất (sẽ tự động ẩn)
                  </div>
                ) : (
                  <div className="text-xs text-center py-2 text-gray-400 italic">
                    Chờ khách yêu cầu thanh toán
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
