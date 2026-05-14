import { Bell, Settings, Search, User, LogOut, Camera, Shield, HelpCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

interface NotificationItem {
  id: string
  title: string
  message: string
  created_at: string
  is_read: boolean
  data?: { order_id?: string; support_request_id?: string; [key: string]: unknown }
}

export default function Header() {
  const { user, updateAvatar, logout } = useAuthStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const notificationPanelRef = useRef<HTMLDivElement>(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications?limit=10`, {
        headers: getAuthHeaders(),
      })
      const list = response.data?.data || []
      setNotifications(list)
      setUnreadCount(response.data?.unread_count || list.filter((n: NotificationItem) => !n.is_read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/notifications/${id}/read`, {}, { headers: getAuthHeaders() })
      await fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.patch(`${API_URL}/notifications/read-all`, {}, { headers: getAuthHeaders() })
      await fetchNotifications()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  useEffect(() => {
    if (!showNotifications) return
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      const el = notificationPanelRef.current
      if (el && !el.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showNotifications])

  useEffect(() => {
    void fetchNotifications()

    const onSocketRefresh = () => void fetchNotifications()
    window.addEventListener('admin:notifications:refresh', onSocketRefresh)
    
    // Chỉ poll khi tab đang active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void fetchNotifications()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Tăng interval lên 15 giây để giảm tải
    const timer = setInterval(() => {
      if (!document.hidden) {
        void fetchNotifications()
      }
    }, 15000)
    
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('admin:notifications:refresh', onSocketRefresh)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Searching for:', searchQuery)
  }

  const handleAvatarClick = () => {
    setShowUserMenu(!showUserMenu)
    setShowNotifications(false)
    setShowSettings(false)
  }

  const handleNotificationClick = () => {
    const next = !showNotifications
    setShowNotifications(next)
    if (next) void fetchNotifications()
    setShowUserMenu(false)
    setShowSettings(false)
  }

  const handleSettingsClick = () => {
    setShowSettings(!showSettings)
    setShowUserMenu(false)
    setShowNotifications(false)
  }

  const handleChangeAvatar = () => {
    fileInputRef.current?.click()
    setShowUserMenu(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateAvatar(reader.result as string)
        alert('Đã cập nhật ảnh đại diện!')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogout = () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      logout()
      navigate('/login')
    }
  }

  const handleProfileClick = () => {
    setShowUserMenu(false)
    navigate('/profile')
  }

  const handleAccountClick = () => {
    setShowUserMenu(false)
    navigate('/account')
  }

  const handleNotificationItemActivate = async (notif: NotificationItem) => {
    if (!notif.is_read) await markAsRead(notif.id)

    const supportId = notif.data?.support_request_id
    setShowNotifications(false)
    if (supportId && typeof supportId === 'string') {
      navigate('/tables')
      return
    }

    const docId = notif.data?.order_id
    if (docId && typeof docId === 'string') {
      navigate(`/orders?orderId=${encodeURIComponent(docId)}`)
      return
    }
    const match = notif.message.match(/(ORD-\d{8}-\d+)/i)
    if (match?.[1]) {
      navigate(`/orders?orderNo=${encodeURIComponent(match[1])}`)
      return
    }
    navigate('/orders')
  }

  const formatTime = (time: any) => {
    const date =
      time?._seconds
        ? new Date((time._seconds * 1000) + Math.floor((time._nanoseconds || 0) / 1_000_000))
        : new Date(time)
    if (Number.isNaN(date.getTime())) return 'Vừa xong'
    return date.toLocaleString('vi-VN')
  }

  return (
    <header className="w-full sticky top-0 z-30 bg-white/80 backdrop-blur-md flex justify-between items-center px-8 py-4 shadow-sm">
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
          <input
            className="w-full bg-[#EAE7E7] border-none rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#AD2C00]/40 transition-all outline-none"
            placeholder="Tìm kiếm phân tích, đơn hàng, món ăn..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center gap-6">
        <nav className="hidden lg:flex items-center gap-6 font-medium">
          <a className="text-stone-500 hover:text-stone-900 transition-colors" href="#">
            Trợ giúp
          </a>
          <a className="text-stone-500 hover:text-stone-900 transition-colors" href="#">
            Hỗ trợ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationPanelRef}>
            <button 
              type="button"
              onClick={handleNotificationClick}
              className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center bg-[#AD2C00] text-white text-[10px] font-bold rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                <div className="bg-gradient-to-r from-[#AD2C00] to-[#D83900] px-4 py-3">
                  <h3 className="text-white font-bold text-sm">Thông báo</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="px-4 py-4 text-sm text-gray-500">Chưa có thông báo mới</div>
                  )}
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          void handleNotificationItemActivate(notif)
                        }
                      }}
                      onClick={() => void handleNotificationItemActivate(notif)}
                      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notif.is_read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-[#AD2C00] rounded-full mt-1.5 flex-shrink-0"></span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{notif.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(notif.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (unreadCount > 0) void markAllAsRead()
                    }}
                    className="text-sm font-semibold text-[#AD2C00] hover:underline w-full text-center"
                  >
                    {unreadCount > 0 ? `Đánh dấu tất cả đã đọc (${unreadCount})` : 'Tất cả đã đọc'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={handleSettingsClick}
              className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cài đặt</p>
                </div>
                <button 
                  onClick={() => {
                    setShowSettings(false)
                    navigate('/settings')
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-semibold text-sm">Cài đặt chung</p>
                    <p className="text-xs text-gray-500">Cấu hình hệ thống</p>
                  </div>
                </button>
                <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-semibold text-sm">Bảo mật</p>
                    <p className="text-xs text-gray-500">Mật khẩu & quyền truy cập</p>
                  </div>
                </button>
                <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-semibold text-sm">Thông báo</p>
                    <p className="text-xs text-gray-500">Quản lý thông báo</p>
                  </div>
                </button>
                <div className="border-t border-gray-100 my-2"></div>
                <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700">
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-semibold text-sm">Trợ giúp & Hỗ trợ</p>
                    <p className="text-xs text-gray-500">Tài liệu & liên hệ</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-stone-200 mx-2"></div>

          <div className="relative">
            <button
              onClick={handleAvatarClick}
              className="relative group"
            >
              <img
                alt="Quản trị viên"
                className="w-10 h-10 rounded-full border-2 border-[#AD2C00]/20 object-cover hover:border-[#AD2C00] transition-all cursor-pointer"
                src={user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCznXIT2M2jGQTSPmUDv6ehnbXsyBDkJKZXBkXu0nGV0gNOdFs04N22RveuUGsej1T1kgffMRLS-PcV31O3qNEXzK8rToKxV5t5gU0vEDt1oNiEJKnlcFvcEomQBKN9KzYDBgEEj0HcP8ai8juyIEujPg_kAVSdC1U9uazsGlD3i0HeDNVdQALfPlebOgXJWwLy0kfoRLMDHrWZu0UWSeyaf4be0dLwmEoB7BHv0_96ocKYLGfF4CWIK569lWLKgBrytOAng44FYQ'}
              />
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-bold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button 
                  onClick={handleChangeAvatar}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                >
                  <Camera className="w-4 h-4 text-[#AD2C00]" />
                  <div>
                    <p className="font-semibold text-sm">Đổi ảnh đại diện</p>
                    <p className="text-xs text-gray-500">Tải ảnh mới lên</p>
                  </div>
                </button>
                <button 
                  onClick={handleProfileClick}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                >
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-semibold text-sm">Hồ sơ cá nhân</p>
                    <p className="text-xs text-gray-500">Xem và chỉnh sửa</p>
                  </div>
                </button>
                <button 
                  onClick={handleAccountClick}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-semibold text-sm">Tài khoản</p>
                    <p className="text-xs text-gray-500">Cài đặt tài khoản</p>
                  </div>
                </button>
                <div className="border-t border-gray-100 my-2"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <div>
                    <p className="font-semibold text-sm">Đăng xuất</p>
                    <p className="text-xs text-red-400">Thoát khỏi hệ thống</p>
                  </div>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
