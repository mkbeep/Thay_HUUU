import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import { Armchair, CheckCircle, ChefHat, Clock, MessageSquare, Wifi, WifiOff, XCircle } from 'lucide-react'
import { useWebSocket } from '../../../hooks/useWebSocket'
import { formatOrderTableBadgeLine } from '../utils/orderTableBadge'

type KitchenStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled'
type PaymentStatus = 'unpaid' | 'payment_pending_confirmation' | 'paid'

interface ApiOrderItem {
  id: string
  quantity: number
  food?: { name?: string } | null
  notes?: string
  special_instructions?: string
}

interface ApiOrder {
  id: string
  order_number: string
  table_session_id?: string
  table_display_label?: string
  status: KitchenStatus
  payment_status?: PaymentStatus
  notes?: string
  created_at?: string | { _seconds: number; _nanoseconds?: number }
  payment_requested_at?: string | { _seconds: number; _nanoseconds?: number }
  items?: ApiOrderItem[]
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const client = axios.create({ baseURL: API_URL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.method?.toLowerCase() === 'get') {
    config.params = { ...(config.params || {}), _t: Date.now() }
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    config.headers.Pragma = 'no-cache'
    config.headers.Expires = '0'
  }
  return config
})

function parseFirestoreDate(value: unknown): Date | null {
  if (value == null) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && value !== null && '_seconds' in (value as object)) {
    const s = (value as { _seconds: number; _nanoseconds?: number })._seconds
    const ns = (value as { _nanoseconds?: number })._nanoseconds ?? 0
    const d = new Date(s * 1000 + Math.floor(ns / 1_000_000))
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const d = (value as { toDate: () => Date }).toDate()
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function formatOrderTime(value: unknown): string {
  const d = parseFirestoreDate(value)
  if (!d) return '—'
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mergeOrder(prev: ApiOrder, incoming: ApiOrder): ApiOrder {
  const incomingItems = incoming.items
  const keepItems =
    Array.isArray(incomingItems) && incomingItems.length > 0 ? incomingItems : prev.items

  return {
    ...prev,
    ...incoming,
    items: keepItems,
    payment_status: incoming.payment_status ?? prev.payment_status,
    notes: incoming.notes ?? prev.notes,
    order_number: incoming.order_number || prev.order_number,
    table_session_id: incoming.table_session_id ?? prev.table_session_id,
    table_display_label: incoming.table_display_label ?? prev.table_display_label,
    created_at: (incoming.created_at as any) ?? prev.created_at,
  }
}

function itemNoteText(item: ApiOrderItem): string | undefined {
  const n = [item.special_instructions, item.notes].find((x) => x && String(x).trim())
  return n ? String(n).trim() : undefined
}

export default function OrdersPageWebSocket() {
  const [searchParams, setSearchParams] = useSearchParams()
  const focusOrderId = searchParams.get('orderId') || searchParams.get('focus')
  const focusOrderNo = searchParams.get('orderNo')

  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { isConnected, on, off } = useWebSocket()

  const loadOrders = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const statuses: KitchenStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'served']
      const results = await Promise.all(statuses.map((status) => client.get('/orders', { params: { status } })))
      const merged = results.flatMap((res) => res.data?.data || [])
      const uniqueById = Array.from(new Map(merged.map((o: ApiOrder) => [o.id, o])).values())
      
      // ✅ TỰ ĐỘNG XÓA CÁC ĐƠN ĐÃ THANH TOÁN
      const unpaidOrders = uniqueById.filter((o: ApiOrder) => o.payment_status !== 'paid')
      
      if (unpaidOrders.length < uniqueById.length) {
        console.log(`🧹 Admin: Auto-removed ${uniqueById.length - unpaidOrders.length} paid order(s)`)
      }
      
      setOrders(unpaidOrders)
      setIsInitialLoad(false)
    } catch (error) {
      console.error('Error loading orders:', error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  const updateOrderOptimistic = useCallback((orderId: string, updates: Partial<ApiOrder>) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updates } : order)))
  }, [])

  const updateStatus = async (id: string, status: KitchenStatus) => {
    const previousOrders = [...orders]
    updateOrderOptimistic(id, { status })

    try {
      await client.patch(`/orders/${id}/status`, { status })
    } catch (error) {
      console.error('Error updating status:', error)
      setOrders(previousOrders)

      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message
        alert(`Không thể cập nhật trạng thái: ${message}`)
      } else {
        alert('Không thể cập nhật trạng thái. Vui lòng thử lại.')
      }
    }
  }

  const cancelOrderAdmin = async (id: string) => {
    if (!confirm('Hủy đơn này? Chỉ áp dụng khi đơn chưa vào bếp.')) return
    try {
      await client.patch(`/orders/${id}/cancel`, {})
      await loadOrders(false)
    } catch (error) {
      console.error('Error cancelling order:', error)
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message
        alert(typeof message === 'string' ? message : 'Không thể hủy đơn.')
      } else {
        alert('Không thể hủy đơn.')
      }
    }
  }

  const confirmPayment = async (id: string) => {
    // ✅ XÓA NGAY KHỎI UI TRƯỚC (Optimistic UI)
    setOrders((prev) => prev.filter((o) => o.id !== id))
    console.log(`🧹 Admin: Removed paid order ${id} from UI (optimistic)`)

    try {
      await client.patch(`/orders/${id}/confirm-payment`)
      console.log(`✅ Payment confirmed on server: ${id}`)
    } catch (error) {
      console.error('Error confirming payment:', error)
      alert('Không thể xác nhận thanh toán. Vui lòng thử lại.')
      // Reload để restore nếu có lỗi
      await loadOrders(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (!mounted) return
      await loadOrders(true)
    }

    void init()

    const handleOrderCreated = (order: ApiOrder) => {
      if (!mounted || order.status === 'cancelled') return
      console.log('📦 New order received:', order)
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev
        return [...prev, order]
      })
    }

    const handleOrderUpdated = (order: ApiOrder) => {
      if (!mounted) return
      console.log('🔄 Order updated:', order)
      
      // ✅ Nếu order đã thanh toán → Xóa ngay khỏi UI
      if (order.payment_status === 'paid') {
        console.log(`🧹 Auto-removed paid order ${order.id} via WebSocket`)
        setOrders((prev) => prev.filter((o) => o.id !== order.id))
        return
      }
      
      if (order.status === 'cancelled') {
        setOrders((prev) => prev.filter((o) => o.id !== order.id))
        return
      }
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id)
        if (!exists) return [...prev, order]
        return prev.map((o) => (o.id === order.id ? mergeOrder(o, order) : o))
      })
    }

    const handleOrderStatusChanged = ({ order }: { orderId: string; status: string; order: ApiOrder }) => {
      if (!mounted) return
      console.log('✅ Order status changed:', order)
      
      // ✅ Nếu order đã thanh toán → Xóa ngay khỏi UI
      if (order.payment_status === 'paid') {
        console.log(`🧹 Auto-removed paid order ${order.id} via WebSocket`)
        setOrders((prev) => prev.filter((o) => o.id !== order.id))
        return
      }
      
      if (order.status === 'cancelled') {
        setOrders((prev) => prev.filter((o) => o.id !== order.id))
        return
      }
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id)
        if (!exists) return [...prev, order]
        return prev.map((o) => (o.id === order.id ? mergeOrder(o, order) : o))
      })
    }

    on('order:created', handleOrderCreated)
    on('order:updated', handleOrderUpdated)
    on('order:status_changed', handleOrderStatusChanged)

    const handleReconnect = () => {
      if (!mounted) return
      console.log('🔄 Reconnected, reloading orders...')
      void loadOrders(false)
    }
    on('connect', handleReconnect)

    return () => {
      mounted = false
      off('order:created', handleOrderCreated)
      off('order:updated', handleOrderUpdated)
      off('order:status_changed', handleOrderStatusChanged)
      off('connect', handleReconnect)
    }
  }, [])

  const activeOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders])

  const group = useMemo(() => {
    const by = (status: KitchenStatus) => activeOrders.filter((o) => o.status === status)
    return {
      pending: by('pending'),
      confirmed: by('confirmed'),
      preparing: by('preparing'),
      ready: by('ready'),
      served: by('served'),
    }
  }, [activeOrders])

  const resolvedFocusDomId = useMemo(() => {
    if (focusOrderId) return `order-card-${focusOrderId}`
    if (focusOrderNo) {
      const found = activeOrders.find((o) => o.order_number === focusOrderNo)
      if (found) return `order-card-${found.id}`
    }
    return null
  }, [focusOrderId, focusOrderNo, activeOrders])

  useEffect(() => {
    if (!resolvedFocusDomId) return
    const t = window.setTimeout(() => {
      document.getElementById(resolvedFocusDomId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 400)
    return () => window.clearTimeout(t)
  }, [resolvedFocusDomId, activeOrders.length])

  const clearFocusParam = useCallback(() => {
    if (!focusOrderId && !focusOrderNo) return
    const next = new URLSearchParams(searchParams)
    next.delete('orderId')
    next.delete('focus')
    next.delete('orderNo')
    setSearchParams(next, { replace: true })
  }, [focusOrderId, focusOrderNo, searchParams, setSearchParams])

  const getStatusBadge = (status: KitchenStatus) => {
    const badges: Record<string, { text: string; color: string }> = {
      pending: { text: 'Đơn mới', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      confirmed: { text: 'Đã nhận', color: 'bg-slate-100 text-slate-800 border-slate-200' },
      preparing: { text: 'Đang nấu', color: 'bg-amber-100 text-amber-900 border-amber-200' },
      ready: { text: 'Sẵn sàng', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
      served: { text: 'Đã phục vụ', color: 'bg-sky-100 text-sky-900 border-sky-200' },
      cancelled: { text: 'Đã hủy', color: 'bg-red-50 text-red-800 border-red-200' },
    }
    return badges[status] || { text: status, color: 'bg-gray-100 text-gray-700 border-gray-200' }
  }

  const getPaymentBadge = (paymentStatus?: PaymentStatus) => {
    const badges = {
      unpaid: { text: 'Chưa thanh toán', color: 'bg-red-50 text-red-800 border-red-200' },
      payment_pending_confirmation: { text: 'Chờ xác nhận TT', color: 'bg-amber-100 text-amber-900 border-amber-200' },
      paid: { text: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
    }
    return badges[paymentStatus || 'unpaid'] || { text: 'Chưa thanh toán', color: 'bg-gray-100 text-gray-700 border-gray-200' }
  }

  const NotesBlock = ({ order }: { order: ApiOrder }) => {
    const lines: string[] = []
    if (order.notes?.trim()) lines.push(order.notes.trim())
    for (const item of order.items || []) {
      const note = itemNoteText(item)
      if (note) {
        const label = item.food?.name || 'Món'
        lines.push(`${label}: ${note}`)
      }
    }
    if (lines.length === 0) return null
    return (
      <div className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-1">
          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
          Ghi chú khách
        </div>
        <ul className="text-xs text-amber-950 space-y-1 list-disc pl-4">
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    )
  }

  const renderCard = (order: ApiOrder, actions: JSX.Element, options?: { hidePaymentBadge?: boolean }) => {
    const statusBadge = getStatusBadge(order.status)
    const paymentBadge = getPaymentBadge(order.payment_status)
    const isFocused =
      (!!focusOrderId && focusOrderId === order.id) ||
      (!!focusOrderNo && focusOrderNo === order.order_number)

    return (
      <div
        id={`order-card-${order.id}`}
        key={order.id}
        className={`rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
          isFocused ? 'ring-2 ring-[#AD2C00] ring-offset-2 border-[#AD2C00]/30' : 'border-stone-200/80'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[#AD2C00] mb-1 truncate">{order.order_number || order.id}</div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1"
              title={order.table_session_id ? `Phiên: ${order.table_session_id}` : undefined}
            >
              <Armchair className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden />
              <span className="text-sm font-semibold text-indigo-900 tabular-nums">
                {formatOrderTableBadgeLine(order.table_display_label, order.table_session_id)}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] font-medium text-stone-500">{formatOrderTime(order.created_at)}</div>
            {order.payment_requested_at && order.payment_status === 'payment_pending_confirmation' && (
              <div className="text-[10px] text-amber-700 mt-0.5">YC TT: {formatOrderTime(order.payment_requested_at)}</div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-md border ${statusBadge.color}`}>{statusBadge.text}</span>
          {!options?.hidePaymentBadge && (
            <span className={`text-xs font-medium px-2 py-1 rounded-md border ${paymentBadge.color}`}>{paymentBadge.text}</span>
          )}
        </div>

        <NotesBlock order={order} />

        <div className="space-y-1 mb-3">
          {(order.items || []).slice(0, 4).map((item) => (
            <div key={item.id} className="text-sm text-stone-800">
              <span className="font-semibold text-[#AD2C00]">{item.quantity}×</span>{' '}
              {item.food?.name || 'Món ăn'}
            </div>
          ))}
          {(order.items || []).length > 4 && (
            <div className="text-xs text-stone-500 italic">+{(order.items || []).length - 4} món khác…</div>
          )}
        </div>

        <div className="space-y-2">{actions}</div>
      </div>
    )
  }

  const columnShell = (title: string, count: number, accent: string, children: React.ReactNode) => (
    <section className="flex flex-col min-h-[120px]">
      <div
        className={`flex items-center justify-between mb-3 rounded-lg px-3 py-2 border ${accent}`}
      >
        <h3 className="font-semibold text-stone-800 text-sm">{title}</h3>
        <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold tabular-nums text-stone-800 shadow-sm">
          {count}
        </span>
      </div>
      <div className="space-y-3 flex-1">{children}</div>
    </section>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Vận hành đơn hàng</h1>
          {isConnected ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200">
              <Wifi className="w-3.5 h-3.5" />
              Real-time
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500 border border-stone-200">
              <WifiOff className="w-3.5 h-3.5" />
              Đang kết nối…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(focusOrderId || focusOrderNo) && (
            <button
              type="button"
              onClick={() => clearFocusParam()}
              className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 hover:bg-stone-50"
            >
              Bỏ lọc thông báo
            </button>
          )}
          <button
            onClick={() => void loadOrders(true)}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#AD2C00] to-[#D83900] text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang tải…' : 'Làm mới'}
          </button>
        </div>
      </div>

      {isInitialLoad && loading && <div className="text-sm text-stone-500 mb-4">Đang tải dữ liệu…</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {columnShell(
          'Đơn mới',
          group.pending.length,
          'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200',
          group.pending.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
              Không có đơn mới
            </div>
          ) : (
            group.pending.map((o) =>
              renderCard(
                o,
                <>
                  <button
                    type="button"
                    onClick={() => void updateStatus(o.id, 'confirmed')}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#AD2C00] to-[#D83900] text-white text-sm font-semibold shadow-sm hover:opacity-95"
                  >
                    <Clock className="inline w-4 h-4 mr-1 align-text-bottom" />
                    Nhận đơn
                  </button>
                  <button
                    type="button"
                    onClick={() => void cancelOrderAdmin(o.id)}
                    className="w-full py-2 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Hủy đơn
                  </button>
                </>
              )
            )
          )
        )}

        {columnShell(
          'Đã nhận',
          group.confirmed.length,
          'bg-gradient-to-r from-slate-50 to-stone-50 border-slate-200',
          group.confirmed.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
              Không có đơn
            </div>
          ) : (
            group.confirmed.map((o) =>
              renderCard(
                o,
                <>
                  <button
                    type="button"
                    onClick={() => void updateStatus(o.id, 'preparing')}
                    className="w-full py-2.5 rounded-lg bg-stone-800 text-white text-sm font-semibold hover:bg-stone-900"
                  >
                    <ChefHat className="inline w-4 h-4 mr-1 align-text-bottom" />
                    Bắt đầu nấu
                  </button>
                  <button
                    type="button"
                    onClick={() => void cancelOrderAdmin(o.id)}
                    className="w-full py-2 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Hủy đơn
                  </button>
                </>
              )
            )
          )
        )}

        {columnShell(
          'Đang nấu',
          group.preparing.length,
          'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200',
          group.preparing.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
              Không có đơn
            </div>
          ) : (
            group.preparing.map((o) =>
              renderCard(
                o,
                <button
                  type="button"
                  onClick={() => void updateStatus(o.id, 'ready')}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                >
                  Sẵn sàng
                </button>
              )
            )
          )
        )}

        {columnShell(
          'Sẵn sàng',
          group.ready.length,
          'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200',
          group.ready.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
              Không có đơn
            </div>
          ) : (
            group.ready.map((o) =>
              renderCard(
                o,
                <button
                  type="button"
                  onClick={() => void updateStatus(o.id, 'served')}
                  className="w-full py-2.5 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
                >
                  Đã phục vụ
                </button>
              )
            )
          )
        )}

        {columnShell(
          'Đã phục vụ',
          group.served.length,
          'bg-gradient-to-r from-sky-50 to-indigo-50 border-sky-200',
          group.served.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
              Không có đơn
            </div>
          ) : (
            group.served.map((o) => {
              const paymentAction =
                o.payment_status === 'payment_pending_confirmation' ? (
                  <button
                    type="button"
                    onClick={() => void confirmPayment(o.id)}
                    className="w-full py-2.5 rounded-lg bg-[#006A35] text-white text-sm font-semibold hover:bg-[#005028]"
                  >
                    <CheckCircle className="inline w-4 h-4 mr-1 align-text-bottom" />
                    Xác nhận đã thanh toán
                  </button>
                ) : o.payment_status === 'paid' ? (
                  <div className="text-xs text-center py-2.5 px-3 bg-emerald-50 text-emerald-800 rounded-lg font-semibold border border-emerald-200">
                    Hoàn tất thanh toán
                  </div>
                ) : (
                  <div className="text-xs text-center py-2.5 text-stone-500 bg-stone-50 rounded-lg border border-stone-100">
                    Chưa yêu cầu thanh toán — khách bấm thanh toán trên app sẽ hiện &quot;Chờ xác nhận TT&quot;
                  </div>
                )

              return renderCard(o, paymentAction, { hidePaymentBadge: false })
            })
          )
        )}
      </div>
    </div>
  )
}
