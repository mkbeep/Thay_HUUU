import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, ChefHat, Clock, CreditCard, MessageSquare, Wifi, WifiOff, XCircle } from 'lucide-react'
import { useWebSocket } from '../../../hooks/useWebSocket'
import { broadcastReportUpdated } from '../../reports/utils/reportRealtime'

type KitchenStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled'
type PaymentStatus = 'unpaid' | 'payment_pending_confirmation' | 'paid'

interface ApiOrderItem {
  id: string
  quantity: number
  unit_price?: number
  subtotal?: number
  food?: { name?: string } | null
  notes?: string
  special_instructions?: string
}

interface ApiOrder {
  id: string
  order_number: string
  table_session_id?: string
  table_number?: string
  status: KitchenStatus
  payment_status?: PaymentStatus
  payment_method?: 'qr' | 'cash' | 'card' | 'e_wallet'
  total_amount?: number
  notes?: string
  created_at?: string | { _seconds: number; _nanoseconds?: number }
  payment_requested_at?: string | { _seconds: number; _nanoseconds?: number }
  items?: ApiOrderItem[]
}

interface ApiDiningTable {
  table_number: string
  current_session?: {
    id: string
  }
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
    table_number: incoming.table_number ?? prev.table_number,
    created_at: (incoming.created_at as any) ?? prev.created_at,
  }
}

function itemNoteText(item: ApiOrderItem): string | undefined {
  const n = [item.special_instructions, item.notes].find((x) => x && String(x).trim())
  return n ? String(n).trim() : undefined
}

function formatVnd(n?: number): string {
  const raw = Number(n) || 0
  return `${Math.round(raw).toLocaleString('vi-VN')}đ`
}

function normalizeVndAmount(value: unknown): number {
  const amount = Number(value) || 0
  return amount > 0 && amount < 1000 ? amount * 1000 : amount
}

function displayOrderTotal(order: ApiOrder): number {
  const total = Number(order.total_amount || 0)
  if (total > 0) return normalizeVndAmount(total)

  const subtotal = (order.items || []).reduce((sum, item) => {
    const itemSubtotal = Number(item.subtotal || 0)
    if (itemSubtotal > 0) return sum + normalizeVndAmount(itemSubtotal)
    return sum + normalizeVndAmount(item.unit_price) * Number(item.quantity || 0)
  }, 0)

  return subtotal > 0 ? Math.round(subtotal * 1.08) : 0
}

function paymentMethodLabel(method?: ApiOrder['payment_method']): string {
  if (method === 'cash') return 'Tiền mặt tại bàn'
  if (method === 'card') return 'Thẻ'
  if (method === 'e_wallet') return 'Ví điện tử'
  if (method === 'qr') return 'Mã QR'
  return 'Chưa chọn'
}

function tableLabelFor(order: ApiOrder, tableBySessionId: Record<string, string>): string {
  return (
    order.table_number ||
    (order.table_session_id ? tableBySessionId[order.table_session_id] : '') ||
    '—'
  )
}

export default function OrdersPageWebSocket() {
  const [searchParams, setSearchParams] = useSearchParams()
  const focusOrderId = searchParams.get('orderId') || searchParams.get('focus')
  const focusOrderNo = searchParams.get('orderNo')

  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [tableBySessionId, setTableBySessionId] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [confirmingPaymentIds, setConfirmingPaymentIds] = useState<Set<string>>(() => new Set())
  const lastScrolledFocusRef = useRef<string | null>(null)
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
      
      setOrders((prev) => {
        const prevById = new Map(prev.map((order) => [order.id, order]))
        return unpaidOrders.map((order) => {
          const existing = prevById.get(order.id)
          return existing ? mergeOrder(existing, order) : order
        })
      })
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

  const loadTableSessionMap = useCallback(async () => {
    try {
      const res = await client.get('/tables')
      const rows: ApiDiningTable[] = res.data?.data || []
      const next: Record<string, string> = {}
      rows.forEach((table) => {
        const sessionId = table.current_session?.id
        if (sessionId) next[sessionId] = table.table_number
      })
      setTableBySessionId(next)
    } catch (error) {
      console.error('Error loading table session map:', error)
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
    if (confirmingPaymentIds.has(id)) return
    setConfirmingPaymentIds((prev) => new Set(prev).add(id))

    // ✅ XÓA NGAY KHỎI UI TRƯỚC (Optimistic UI)
    setOrders((prev) => prev.filter((o) => o.id !== id))
    console.log(`🧹 Admin: Removed paid order ${id} from UI (optimistic)`)

    try {
      await client.patch(`/orders/${id}/confirm-payment`)
      console.log(`✅ Payment confirmed on server: ${id}`)
      broadcastReportUpdated({ reason: 'payment_confirmed', orderId: id })
    } catch (error) {
      console.error('Error confirming payment:', error)
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.response?.data?.error || error.message
        : 'Vui lòng thử lại.'
      alert(`Không thể xác nhận thanh toán: ${message}`)
      // Reload để restore nếu có lỗi
      await loadOrders(false)
    } finally {
      setConfirmingPaymentIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (!mounted) return
      await Promise.all([loadOrders(true), loadTableSessionMap()])
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
      void Promise.all([loadOrders(false), loadTableSessionMap()])
    }
    on('connect', handleReconnect)

    return () => {
      mounted = false
      off('order:created', handleOrderCreated)
      off('order:updated', handleOrderUpdated)
      off('order:status_changed', handleOrderStatusChanged)
      off('connect', handleReconnect)
    }
  }, [loadOrders, loadTableSessionMap, on, off])

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
    if (lastScrolledFocusRef.current === resolvedFocusDomId) return
    lastScrolledFocusRef.current = resolvedFocusDomId
    const t = window.setTimeout(() => {
      document.getElementById(resolvedFocusDomId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 400)
    return () => window.clearTimeout(t)
  }, [resolvedFocusDomId])

  const paymentRequests = useMemo(() => {
    return group.served
      .filter((order) => order.payment_status === 'payment_pending_confirmation')
      .sort((a, b) => {
        const at = parseFirestoreDate(a.payment_requested_at)?.getTime() || 0
        const bt = parseFirestoreDate(b.payment_requested_at)?.getTime() || 0
        return bt - at
      })
  }, [group.served])

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
    const tableLabel = tableLabelFor(order, tableBySessionId)
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
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1">
              <span className="text-xs font-medium text-indigo-600">Bàn</span>
              <span className="text-sm font-bold text-indigo-800">{tableLabel}</span>
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

        <div className="mb-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-stone-600">Tổng cần thu</span>
            <span className="font-bold text-[#AD2C00]">{formatVnd(displayOrderTotal(order))}</span>
          </div>
          {order.payment_status === 'payment_pending_confirmation' && (
            <div className="mt-1 text-xs font-semibold text-amber-800">
              Khách chọn: {paymentMethodLabel(order.payment_method)}
            </div>
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
      {paymentRequests.length > 0 && (
        <aside className="fixed right-6 top-28 z-[70] w-72 rounded-xl border border-amber-200 bg-white shadow-xl pointer-events-auto">
          <div className="flex items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#AD2C00]" />
              <span className="text-sm font-bold text-stone-900">Yêu cầu thanh toán</span>
            </div>
            <span className="rounded-full bg-[#AD2C00] px-2 py-0.5 text-xs font-bold text-white">
              {paymentRequests.length}
            </span>
          </div>
          <div className="max-h-[360px] overflow-y-auto p-3 space-y-2">
            {paymentRequests.slice(0, 5).map((order) => (
              <div key={order.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#AD2C00]">
                      Bàn {tableLabelFor(order, tableBySessionId)}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {formatOrderTime(order.payment_requested_at)}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-stone-900">
                    {formatVnd(displayOrderTotal(order))}
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-semibold text-amber-800">
                  {paymentMethodLabel(order.payment_method)}
                </div>
                <button
                  type="button"
                  onClick={() => void confirmPayment(order.id)}
                  disabled={confirmingPaymentIds.has(order.id)}
                  className="mt-3 w-full rounded-lg bg-[#006A35] px-3 py-2 text-xs font-bold text-white hover:bg-[#005028] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {confirmingPaymentIds.has(order.id) ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
                </button>
              </div>
            ))}
            {paymentRequests.length > 5 && (
              <div className="text-center text-xs text-stone-500">
                +{paymentRequests.length - 5} yêu cầu khác trong cột Đã phục vụ
              </div>
            )}
          </div>
        </aside>
      )}

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
                    disabled={confirmingPaymentIds.has(o.id)}
                    className="w-full py-2.5 rounded-lg bg-[#006A35] text-white text-sm font-semibold hover:bg-[#005028] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle className="inline w-4 h-4 mr-1 align-text-bottom" />
                    {confirmingPaymentIds.has(o.id)
                      ? 'Đang xác nhận...'
                      : o.payment_method === 'cash'
                        ? 'Xác nhận đã thu tiền mặt'
                        : 'Xác nhận đã thanh toán'}
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
