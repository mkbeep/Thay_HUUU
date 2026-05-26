import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BellRing, CheckCircle, Hand, X } from 'lucide-react'
import { useWebSocket } from '../../hooks/useWebSocket'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export interface SupportAlertItem {
  id: string
  table_id: string
  table_number: string
  type: string
  priority?: string
  message: string
  created_at: string | { _seconds: number }
}

const TYPE_LABELS: Record<string, string> = {
  'call-staff': 'Gọi nhân viên',
  'add-water': 'Thêm nước',
  'add-tissue': 'Thêm khăn giấy',
  'add-utensils': 'Thêm đồ ăn kèm',
  'change-gas': 'Thay bình gas',
  'clean-table': 'Dọn bàn',
  'ask-question': 'Hỏi món ăn',
  'report-issue': 'Báo vấn đề',
}

function formatTime(value: unknown): string {
  if (!value) return 'Vừa xong'
  const date =
    typeof value === 'object' && value !== null && '_seconds' in (value as object)
      ? new Date((value as { _seconds: number })._seconds * 1000)
      : new Date(value as string)
  if (Number.isNaN(date.getTime())) return 'Vừa xong'
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function authHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function toAlertItem(raw: Record<string, unknown>, fallbackMessage?: string): SupportAlertItem {
  const type = String(raw.type || 'call-staff')
  return {
    id: String(raw.id),
    table_id: String(raw.table_id || ''),
    table_number: String(raw.table_number || '—'),
    type,
    priority: raw.priority ? String(raw.priority) : undefined,
    message:
      fallbackMessage ||
      (TYPE_LABELS[type] ? `Khách: ${TYPE_LABELS[type]}` : 'Khách cần hỗ trợ'),
    created_at: (raw.created_at as string) || new Date().toISOString(),
  }
}

export default function SupportAlertsPanel() {
  const navigate = useNavigate()
  const { on, off } = useWebSocket()
  const [alerts, setAlerts] = useState<SupportAlertItem[]>([])
  const [dismissingId, setDismissingId] = useState<string | null>(null)

  const upsertAlert = useCallback((item: SupportAlertItem) => {
    if (!item.id || item.id === 'undefined') return
    setAlerts((prev) => {
      if (prev.some((a) => a.id === item.id)) return prev
      return [item, ...prev].slice(0, 8)
    })
  }, [])

  const loadPending = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/support-requests/pending`, {
        headers: authHeaders(),
      })
      const list = res.data?.data || []
      if (!Array.isArray(list)) return
      list.forEach((row: Record<string, unknown>) => {
        upsertAlert(toAlertItem(row))
      })
    } catch (e) {
      console.error('Load pending support requests failed', e)
    }
  }, [upsertAlert])

  useEffect(() => {
    void loadPending()
    const timer = setInterval(() => {
      if (!document.hidden) void loadPending()
    }, 5_000)
    return () => clearInterval(timer)
  }, [loadPending])

  useEffect(() => {
    const onSupportCreated = (payload: Record<string, unknown>) => {
      upsertAlert(toAlertItem(payload))
    }

    const onNotification = (notif: {
      title?: string
      message?: string
      data?: { support_request_id?: string; table_id?: string; table_number?: string; type?: string }
    }) => {
      const sid = notif.data?.support_request_id
      if (!sid) return
      upsertAlert({
        id: sid,
        table_id: String(notif.data?.table_id || ''),
        table_number: String(notif.data?.table_number || notif.title?.replace(/.*bàn\s*/i, '') || '—'),
        type: String(notif.data?.type || 'call-staff'),
        message: notif.message || 'Khách cần hỗ trợ',
        created_at: new Date().toISOString(),
      })
    }

    const onSupportUpdated = (payload: { id?: string; status?: string }) => {
      const id = payload.id ? String(payload.id) : ''
      if (!id) return
      if (payload.status && payload.status !== 'pending') {
        setAlerts((prev) => prev.filter((a) => a.id !== id))
      }
    }

    on('support:request_created', onSupportCreated)
    on('support:request_updated', onSupportUpdated)
    on('notification:new', onNotification)
    return () => {
      off('support:request_created', onSupportCreated)
      off('support:request_updated', onSupportUpdated)
      off('notification:new', onNotification)
    }
  }, [on, off, upsertAlert])

  const dismiss = async (id: string) => {
    setDismissingId(id)
    try {
      await axios.patch(
        `${API_URL}/support-requests/${id}`,
        { status: 'completed' },
        { headers: authHeaders() }
      )
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      console.error('Complete support request failed', e)
      alert('Không cập nhật được yêu cầu. Thử lại.')
    } finally {
      setDismissingId(null)
    }
  }

  if (alerts.length === 0) return null

  return (
    <aside
      className="fixed right-6 top-28 z-[75] w-72 max-w-[calc(100vw-3rem)] pointer-events-auto"
      aria-live="polite"
    >
      <div className="rounded-xl border border-amber-300 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-[#AD2C00] animate-pulse" />
            <span className="text-sm font-bold text-stone-900">Gọi hỗ trợ</span>
          </div>
          <span className="rounded-full bg-[#AD2C00] px-2 py-0.5 text-xs font-bold text-white">
            {alerts.length}
          </span>
        </div>
        <div className="max-h-[min(50vh,360px)] overflow-y-auto p-3 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#AD2C00]">
                    <Hand className="h-3.5 w-3.5 shrink-0" />
                    Bàn {alert.table_number}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {TYPE_LABELS[alert.type] || alert.message}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">{formatTime(alert.created_at)}</p>
                </div>
                <button
                  type="button"
                  aria-label="Ẩn tạm"
                  onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                  className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-white hover:text-stone-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/tables')}
                  className="flex-1 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Xem bàn
                </button>
                <button
                  type="button"
                  disabled={dismissingId === alert.id}
                  onClick={() => void dismiss(alert.id)}
                  className="flex-1 rounded-lg bg-[#006A35] px-2 py-1.5 text-xs font-bold text-white hover:bg-[#005028] disabled:opacity-60"
                >
                  {dismissingId === alert.id ? '…' : (
                    <>
                      <CheckCircle className="inline h-3.5 w-3.5 mr-0.5 align-text-bottom" />
                      Đã xử lý
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
