import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';

type TableStatus = 'available' | 'occupied' | 'billing';
type ZoneType = 'main' | 'terrace' | 'private';

interface SessionStats {
  minutesUsed: number;
  unpaidTotal: number;
  pendingKitchen: number;
}

interface Table {
  id: string;
  number: string;
  name: string;
  zone: ZoneType;
  capacity: string;
  location: string;
  status: TableStatus;
  qrCode: string;
  sessionId?: string;
  autoCloseAt?: string | null;
  sessionStats?: SessionStats;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({ baseURL: API_URL })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface ApiDiningTable {
  id: string;
  table_number: string;
  capacity: number;
  status: string;
  qr_code?: string;
  location?: string;
  current_session?: {
    id: string;
    table_id: string;
    is_active: boolean;
    customer_count?: number;
    started_at?: string;
    auto_close_at?: string | { _seconds: number } | null;
    session_stats?: {
      minutes_used: number;
      unpaid_total: number;
      pending_kitchen_items: number;
    };
  };
  /** Do backend tính từ CUSTOMER_WEB_BASE_URL — luôn là link http(s) mở web khách */
  customer_menu_url?: string;
}

function fallbackMenuUrl(t: Pick<ApiDiningTable, 'id' | 'table_number'>): string {
  const webBase = (import.meta.env.VITE_CUSTOMER_WEB_URL || 'http://localhost:8081').replace(/\/+$/, '');
  const num = encodeURIComponent(t.table_number);
  const tid = encodeURIComponent(t.id);
  return `${webBase}/table/${num}?tid=${tid}`;
}

/**
 * Ảnh QR (qrserver) luôn encode **URL web** — camera điện thoại mở trình duyệt, không còn JSON.
 */
function resolveQrCodeUrl(t: ApiDiningTable): string {
  const menuUrl = (t.customer_menu_url || '').trim() || fallbackMenuUrl(t);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(menuUrl)}`;
}

/** QR theo số bàn + id hiện tại (khi admin đổi số bàn trên form, xem trước khớp URL sau khi lưu). */
function previewQrForTable(t: Pick<Table, 'id' | 'number'>): string {
  return resolveQrCodeUrl({
    id: t.id,
    table_number: String(t.number),
    capacity: 0,
    status: 'available',
  });
}

function formatRelativeVi(date: Date | null, _refreshKey?: number): string {
  if (!date) return 'Chưa đồng bộ';
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (sec < 8) return 'Vừa xong';
  if (sec < 60) return `${sec} giây trước`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  return date.toLocaleString('vi-VN');
}

function inferZone(location?: string): ZoneType {
  const l = (location || '').toLowerCase();
  if (l.includes('vip') || l.includes('phòng') || l.includes('tầng 2')) return 'private';
  if (l.includes('sân vườn') || l.includes('ngoài trời') || l.includes('thượng')) return 'terrace';
  return 'main';
}

function mapApiStatus(s: string): TableStatus {
  const u = (s || '').toLowerCase();
  if (u === 'occupied') return 'occupied';
  if (u === 'reserved' || u === 'cleaning' || u === 'billing') return 'billing';
  return 'available';
}

function mapApiTableToUi(t: ApiDiningTable): Table {
  const cap = typeof t.capacity === 'number' ? t.capacity : Number(t.capacity) || 0;
  const sess = t.current_session;
  const autoCloseMs = parseFirestoreTime(sess?.auto_close_at);
  return {
    id: t.id,
    number: t.table_number,
    name: `Bàn ${t.table_number}`,
    zone: inferZone(t.location),
    capacity: cap > 0 ? `${cap} khách` : '—',
    location: t.location || '—',
    status: t.current_session?.is_active && mapApiStatus(t.status) === 'available'
      ? 'occupied'
      : mapApiStatus(t.status),
    qrCode: resolveQrCodeUrl(t),
    sessionId: sess?.id,
    autoCloseAt: autoCloseMs ? new Date(autoCloseMs).toISOString() : null,
    sessionStats: sess?.session_stats
      ? {
          minutesUsed: sess.session_stats.minutes_used,
          unpaidTotal: sess.session_stats.unpaid_total,
          pendingKitchen: sess.session_stats.pending_kitchen_items,
        }
      : undefined,
  };
}

function formatVnd(n: number): string {
  if (!n || Number.isNaN(n)) return '0đ';
  const amount = n > 0 && n < 1000 ? n * 1000 : n;
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}

function parseFirestoreTime(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'string') return new Date(value).getTime();
  if (typeof value === 'object' && value !== null && '_seconds' in (value as object)) {
    return (value as { _seconds: number })._seconds * 1000;
  }
  return null;
}

function formatAutoCloseCountdown(autoCloseAt: string | undefined, nowMs: number): string | null {
  const closeMs = autoCloseAt ? new Date(autoCloseAt).getTime() : NaN;
  if (!closeMs || Number.isNaN(closeMs)) return null;
  const sec = Math.max(0, Math.ceil((closeMs - nowMs) / 1000));
  if (sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TablesPage() {
  const [selectedZone, setSelectedZone] = useState<ZoneType>('main');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [orderTotals, setOrderTotals] = useState<Record<string, number>>({});
  const [sessionConflictAlert, setSessionConflictAlert] = useState<string | null>(null);
  const [newTable, setNewTable] = useState({
    number: '',
    name: '',
    zone: 'main' as ZoneType,
    capacity: '',
    location: ''
  });

  const refreshOneTable = useCallback(async (tableId: string) => {
    try {
      const res = await api.get<{ data: ApiDiningTable }>(`/tables/${tableId}`);
      const row = res.data?.data;
      if (!row) return;
      const ui = mapApiTableToUi(row);
      setTables((prev) => prev.map((t) => (t.id === tableId ? ui : t)));
      if (ui.sessionId && (ui.status === 'occupied' || ui.status === 'billing')) {
        const ordersRes = await api.get('/orders', {
          params: { table_session_id: ui.sessionId },
        });
        const list = ordersRes.data?.data || [];
        const sum = list.reduce(
          (s: number, o: { total_amount?: number; payment_status?: string }) =>
            o.payment_status === 'paid' ? s : s + (Number(o.total_amount) || 0),
          0
        );
        setOrderTotals((prev) => ({ ...prev, [tableId]: sum }));
      } else {
        setOrderTotals((prev) => {
          const next = { ...prev };
          delete next[tableId];
          return next;
        });
      }
      setLastSyncedAt(new Date());
    } catch (e) {
      console.error('Refresh single table failed', e);
    }
  }, []);

  const loadTablesFromApi = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setListError(null);
      setListLoading(true);
    } else {
      setListError(null);
    }
    try {
      const res = await api.get<{ data: ApiDiningTable[] }>('/tables');
      const rows = res.data?.data || [];
      if (rows.length === 0) {
        setTables([]);
        setLastSyncedAt(new Date());
        return;
      }
      setTables(rows.map(mapApiTableToUi));
      setLastSyncedAt(new Date());
    } catch (e) {
      console.error('Load tables failed', e);
      if (!silent) {
        setListError('Không tải được danh sách bàn từ máy chủ. Kiểm tra backend / CORS.')
        setTables([]);
      }
    } finally {
      if (!silent) setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTablesFromApi();
  }, [loadTablesFromApi]);

  // WebSocket listener for table status changes
  useEffect(() => {
    const socket = (window as any).socket;
    if (!socket) {
      console.warn('⚠️ WebSocket not available for TablesPage');
      return;
    }

    const handleTableEvent = (data: { tableId: string }) => {
      if (data?.tableId) void refreshOneTable(data.tableId);
    };

    const handleSessionConflict = (data: { tableId: string; message?: string }) => {
      setSessionConflictAlert(
        data.message || `Bàn ${data.tableId}: có khách mới quét QR — cần kiểm tra thực tế.`
      );
      if (data?.tableId) void refreshOneTable(data.tableId);
    };

    socket.on('table:status_changed', handleTableEvent);
    socket.on('table:updated', handleTableEvent);
    socket.on('table:document_changed', handleTableEvent);
    socket.on('session:conflict', handleSessionConflict);
    socket.on('session:closing_soon', handleTableEvent);
    socket.on('session:auto_closing', handleTableEvent);

    console.log('✅ TablesPage WebSocket listeners registered');

    return () => {
      socket.off('table:status_changed', handleTableEvent);
      socket.off('table:updated', handleTableEvent);
      socket.off('table:document_changed', handleTableEvent);
      socket.off('session:conflict', handleSessionConflict);
      socket.off('session:closing_soon', handleTableEvent);
      socket.off('session:auto_closing', handleTableEvent);
      console.log('🔌 TablesPage WebSocket listeners removed');
    };
  }, [refreshOneTable]);

  useEffect(() => {
    const hasCountdown = tables.some((t) => t.autoCloseAt);
    const intervalMs = hasCountdown ? 1000 : 30_000;
    const t = setInterval(() => setNowTick((n) => n + 1), intervalMs);
    return () => clearInterval(t);
  }, [tables]);

  useEffect(() => {
    const targets = tables.filter((t) => t.status === 'occupied' || t.status === 'billing');
    if (targets.length === 0) {
      setOrderTotals({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        targets.map(async (t) => {
          try {
            if (!t.sessionId) return [t.id, 0] as const;
            const res = await api.get('/orders', {
              params: { table_session_id: t.sessionId },
            });
            const list = res.data?.data || [];
            const sum = list.reduce(
              (s: number, o: { total_amount?: number; payment_status?: string }) =>
                o.payment_status === 'paid' ? s : s + (Number(o.total_amount) || 0),
              0
            );
            return [t.id, sum] as const;
          } catch {
            return [t.id, 0] as const;
          }
        })
      );
      if (!cancelled) setOrderTotals(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [tables]);

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          badge: 'bg-green-100',
          border: 'border-green-200',
          circle: 'bg-green-500'
        };
      case 'occupied':
        return {
          bg: 'bg-red-50',
          text: 'text-[#AD2C00]',
          badge: 'bg-red-100',
          border: 'border-red-200',
          circle: 'bg-[#AD2C00]'
        };
      case 'billing':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          badge: 'bg-blue-100',
          border: 'border-blue-200',
          circle: 'bg-blue-500'
        };
    }
  };

  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'Trống';
      case 'occupied':
        return 'Đang dùng';
      case 'billing':
        return 'Thanh toán';
    }
  };

  const filteredTables = tables.filter(table => table.zone === selectedZone);

  const handleAddTable = async () => {
    if (!newTable.number || !newTable.name) return;

    try {
      // Tạo bàn mới trên server
      const capNum = parseInt(newTable.capacity, 10) || 2;
      await api.post('/tables', {
        table_number: newTable.number,
        capacity: capNum,
        location: newTable.location || 'Không xác định',
        status: 'available'
      });

      // Reload danh sách bàn từ server để có ID và QR code chính xác
      await loadTablesFromApi();

      setShowAddModal(false);
      setNewTable({
        number: '',
        name: '',
        zone: 'main',
        capacity: '',
        location: ''
      });
    } catch (error) {
      console.error('Error adding table:', error);
      alert('Không thể thêm bàn. Vui lòng thử lại.');
    }
  };

  const handleEditTable = (table: Table) => {
    setSelectedTable(table);
    setShowEditPanel(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTable) return;

    try {
      // Cập nhật bàn trên server
      const capNum = parseInt(selectedTable.capacity.replace(/[^\d]/g, ''), 10) || 2;
      await api.put(`/tables/${selectedTable.id}`, {
        table_number: selectedTable.number,
        capacity: capNum,
        location: selectedTable.location,
        status: selectedTable.status
      });

      // Reload danh sách bàn từ server để có QR code cập nhật
      await loadTablesFromApi();

      setShowEditPanel(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Error updating table:', error);
      alert('Không thể cập nhật bàn. Vui lòng thử lại.');
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bàn này?')) return;

    try {
      await api.delete(`/tables/${id}`);
      
      // Reload danh sách bàn từ server
      await loadTablesFromApi();

      setShowEditPanel(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('Không thể xóa bàn. Vui lòng thử lại.');
    }
  };

  const handleViewQR = (table: Table) => {
    setSelectedTable(table);
    setShowQRModal(true);
    void (async () => {
      try {
        const res = await api.get<{ data: ApiDiningTable }>(`/tables/${table.id}`);
        const row = res.data?.data;
        if (row) setSelectedTable(mapApiTableToUi(row));
      } catch {
        /* giữ QR từ danh sách */
      }
    })();
  };

  const handlePrintQR = () => {
    window.print();
  };

  const handleResetTable = async (table: Table) => {
    if (!confirm(`Reset bàn ${table.number}? Session cũ sẽ đóng và bàn về trống.`)) return;
    try {
      await api.post(`/tables/${table.id}/reset`);
      await refreshOneTable(table.id);
    } catch (e) {
      console.error('Reset table failed', e);
      alert('Không reset được bàn.');
    }
  };

  const handleDownloadQR = () => {
    if (!selectedTable) return;
    const link = document.createElement('a');
    link.href = selectedTable.qrCode;
    link.download = `QR-Ban-${selectedTable.number}.png`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Sơ Đồ Bàn
          </h1>
          <div className="flex items-center gap-3 text-sm mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-gray-600">Trực tuyến</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span className="text-gray-500">
              Cập nhật {formatRelativeVi(lastSyncedAt, nowTick)}
            </span>
          </div>
        </div>
        
        <button 
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Thêm Bàn Mới
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <button
            onClick={() => setSelectedZone('main')}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              selectedZone === 'main'
                ? 'bg-white text-[#AD2C00] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Khu Chính
          </button>
          <button
            onClick={() => setSelectedZone('terrace')}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              selectedZone === 'terrace'
                ? 'bg-white text-[#AD2C00] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sân Thượng
          </button>
          <button
            onClick={() => setSelectedZone('private')}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              selectedZone === 'private'
                ? 'bg-white text-[#AD2C00] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Phòng Riêng
          </button>
        </div>

        <div className="flex items-center gap-6 px-6 py-3 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600 uppercase tracking-wider">Trống</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-3 h-3 rounded-full bg-[#AD2C00]"></span>
            <span className="text-gray-600 uppercase tracking-wider">Đang dùng</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-gray-600 uppercase tracking-wider">Thanh toán</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="text-gray-600 uppercase tracking-wider">Sắp trống</span>
          </div>
        </div>
      </div>

      {listLoading && (
        <p className="text-sm text-gray-500">Đang tải sơ đồ bàn…</p>
      )}
      {listError && (
        <p className="text-sm text-red-600">{listError}</p>
      )}
      {sessionConflictAlert && (
        <div className="flex items-center justify-between gap-4 text-sm text-amber-900 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
          <span>{sessionConflictAlert}</span>
          <button
            type="button"
            className="shrink-0 font-bold text-amber-900 underline"
            onClick={() => setSessionConflictAlert(null)}
          >
            Đóng
          </button>
        </div>
      )}
      {!listLoading && tables.length === 0 && !listError && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Chưa có dữ liệu bàn từ máy chủ. Kiểm tra Firestore collection <code className="text-xs">dining_table</code> hoặc chạy seed bàn.
        </p>
      )}
      {!listLoading && tables.length > 0 && filteredTables.length === 0 && (
        <p className="text-sm text-gray-500">Không có bàn trong khu vực đang chọn.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => {
          const colors = getStatusColor(table.status);
          const total = orderTotals[table.id];
          const countdown = formatAutoCloseCountdown(table.autoCloseAt ?? undefined, Date.now() + nowTick * 0);
          const stats = table.sessionStats;
          const isActiveSession =
            table.status === 'occupied' || table.status === 'billing';
          const isAutoClosing = Boolean(countdown && isActiveSession);
          return (
            <div
              key={table.id}
              className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 relative border border-gray-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1.5 items-start">
                  {isAutoClosing ? (
                    <div className="inline-flex flex-col gap-0.5 items-start">
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Sắp trống
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 text-gray-700 px-2.5 py-0.5 text-[10px] font-bold tabular-nums">
                        {countdown}
                      </span>
                    </div>
                  ) : (
                    <div className={`${colors.badge} ${colors.text} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest`}>
                      {getStatusText(table.status)}
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  title="Xem mã QR"
                  onClick={() => handleViewQR(table)}
                  className="shrink-0 rounded-lg border border-gray-100 bg-gray-50 p-1.5 hover:border-[#AD2C00]/40 hover:bg-orange-50/50 transition-colors"
                >
                  <img
                    src={table.qrCode}
                    alt=""
                    className="h-9 w-9 object-cover rounded"
                  />
                </button>
              </div>

              <div className="text-center py-4">
                <div className={`w-20 h-20 mx-auto rounded-full ${colors.bg} border-4 border-white shadow-inner flex items-center justify-center mb-3`}>
                  <span className={`text-xl font-bold ${colors.text} px-1`}>{table.number}</span>
                </div>
                <h3 className="font-bold text-gray-900">{table.name}</h3>
                <p className="text-xs text-gray-500">{table.capacity} • {table.location}</p>
                {isActiveSession && stats && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center w-full max-w-[220px] mx-auto">
                    <div className="rounded-lg bg-gray-50 px-1 py-1.5">
                      <p className="text-[9px] font-bold text-gray-500 uppercase">Đã dùng</p>
                      <p className="text-xs font-black text-gray-900">{stats.minutesUsed}p</p>
                    </div>
                    <div className="rounded-lg bg-orange-50 px-1 py-1.5">
                      <p className="text-[9px] font-bold text-orange-700 uppercase">Chưa TT</p>
                      <p className="text-[10px] font-black text-[#AD2C00]">{formatVnd(stats.unpaidTotal)}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 px-1 py-1.5">
                      <p className="text-[9px] font-bold text-blue-700 uppercase">Bếp</p>
                      <p className="text-xs font-black text-blue-800">{stats.pendingKitchen}</p>
                    </div>
                  </div>
                )}
                {(table.status === 'occupied' || table.status === 'billing') && total != null && total > 0 && (
                  <div className={`mt-3 inline-flex flex-col items-center rounded-xl px-4 py-2 ${
                    table.status === 'billing'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-orange-50 text-[#AD2C00] border border-orange-100'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {table.status === 'billing' ? 'Cần thu' : 'Tạm tính'}
                    </span>
                    <span className="text-sm font-black tabular-nums">{formatVnd(total)}</span>
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-white/95 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-opacity p-6 backdrop-blur-sm">
                <button 
                  onClick={() => handleEditTable(table)}
                  className="w-full py-2.5 bg-[#AD2C00] text-white rounded-full font-bold text-sm shadow-md hover:bg-[#D83900] transition-colors"
                >
                  Chỉnh sửa bàn
                </button>
                <button 
                  onClick={() => handleViewQR(table)}
                  className="w-full py-2.5 bg-gray-100 text-gray-900 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  Xem mã QR
                </button>
                {(table.status === 'occupied' || table.status === 'billing') && (
                  <button
                    type="button"
                    onClick={() => void handleResetTable(table)}
                    className="w-full py-2.5 border-2 border-amber-300 text-amber-800 rounded-full font-bold text-sm hover:bg-amber-50 transition-colors"
                  >
                    Reset bàn (zombie)
                  </button>
                )}
                {table.status === 'available' && (
                  <button 
                    onClick={() => handleDeleteTable(table.id)}
                    className="w-full py-2.5 border-2 border-red-200 text-red-600 rounded-full font-bold text-sm hover:bg-red-50 transition-colors"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Thêm Bàn Mới</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Số bàn
                </label>
                <input
                  type="text"
                  value={newTable.number}
                  onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  placeholder="01"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Tên bàn
                </label>
                <input
                  type="text"
                  value={newTable.name}
                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  placeholder="Bàn Cửa Sổ"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Khu vực
                </label>
                <select
                  value={newTable.zone}
                  onChange={(e) => setNewTable({ ...newTable, zone: e.target.value as ZoneType })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                >
                  <option value="main">Khu Chính</option>
                  <option value="terrace">Sân Thượng</option>
                  <option value="private">Phòng Riêng</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Sức chứa
                </label>
                <input
                  type="text"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  placeholder="2-4 Khách"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Vị trí
                </label>
                <input
                  type="text"
                  value={newTable.location}
                  onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                  placeholder="Trong nhà"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleAddTable}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Thêm bàn
              </button>
            </div>
          </div>
        </div>
      )}

      {showQRModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Mã QR - Bàn {selectedTable.number}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedTable.name}</p>
              </div>
              <button 
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center mb-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <img
                  src={selectedTable.qrCode}
                  alt={`QR Code Bàn ${selectedTable.number}`}
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-4 italic">
                Quét mã QR này để mở <strong>trang web</strong> thực đơn (bàn {selectedTable.number}) trong trình duyệt — không hiện JSON.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadQR}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg"></span>
                Tải xuống
              </button>
              <button
                onClick={handlePrintQR}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg"></span>
                In mã QR
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPanel && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Bàn</h3>
                <p className="text-sm text-gray-500 mt-1">Quản lý thông tin Bàn {selectedTable.number}</p>
              </div>
              <button 
                onClick={() => setShowEditPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Số bàn
                </label>
                <input
                  type="text"
                  value={selectedTable.number}
                  onChange={(e) => setSelectedTable({ ...selectedTable, number: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Tên bàn
                </label>
                <input
                  type="text"
                  value={selectedTable.name}
                  onChange={(e) => setSelectedTable({ ...selectedTable, name: e.target.value })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Khu vực
                </label>
                <select
                  value={selectedTable.zone}
                  onChange={(e) => setSelectedTable({ ...selectedTable, zone: e.target.value as ZoneType })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                >
                  <option value="main">Khu Chính</option>
                  <option value="terrace">Sân Thượng</option>
                  <option value="private">Phòng Riêng</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-2">
                  Trạng thái
                </label>
                <select
                  value={selectedTable.status}
                  onChange={(e) => setSelectedTable({ ...selectedTable, status: e.target.value as TableStatus })}
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-base font-medium text-gray-900 focus:ring-2 focus:ring-[#AD2C00] focus:border-[#AD2C00] outline-none transition-all"
                >
                  <option value="available">Trống</option>
                  <option value="occupied">Đang dùng</option>
                  <option value="billing">Thanh toán</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="text-xs uppercase tracking-widest font-bold text-gray-900 block mb-3">
                  Xem trước mã QR
                </label>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 flex flex-col items-center border-2 border-gray-200">
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <img
                      src={previewQrForTable(selectedTable)}
                      alt={`QR Code Bàn ${selectedTable.number}`}
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="text-sm text-[#AD2C00] font-bold mt-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-base"></span>
                    Tự động tạo...
                  </p>
                </div>
                <p className="text-xs text-gray-700 text-center mt-3 font-medium">
                  Quét mã QR sẽ mở <strong>trang web</strong> đặt món cho Bàn {selectedTable.number} (URL, không phải văn bản JSON).
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowEditPanel(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-6 py-3 bg-gradient-to-br from-[#AD2C00] to-[#D83900] text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
