import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import MenuPage from './features/menu/pages/MenuPage'
import OrdersPageWebSocket from './features/orders/pages/OrdersPageWebSocket'
import TablesPage from './features/tables/pages/TablesPage'
import InventoryPage from './features/inventory/pages/InventoryPage'
import PromotionsPage from './features/promotions/pages/PromotionsPage'
import ReportsPage from './features/reports/pages/ReportsPage'
import StaffPage from './features/staff/pages/StaffPage'
import SettingsPage from './features/settings/pages/SettingsPage'
import ProfilePage from './features/settings/pages/ProfilePage'
import AccountPage from './features/settings/pages/AccountPage'
import { useEffect } from 'react'
import { socketService } from './services/socketService'

function App() {
  const { isAuthenticated } = useAuthStore()

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    const token = localStorage.getItem('token')
    const socket = socketService.connect(token || undefined)

    const onNewNotification = () => {
      window.dispatchEvent(new CustomEvent('admin:notifications:refresh'))
    }
    socket.on('notification:new', onNewNotification)

    const onConnect = () => {
      socket.emit('join:admin')
      console.log('👨‍💼 Joined admin room')
    }

    if (socket.connected) {
      onConnect()
    } else {
      socket.on('connect', onConnect)
    }

    return () => {
      socket.off('notification:new', onNewNotification)
      socket.off('connect', onConnect)
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/orders" element={<OrdersPageWebSocket />} />
        <Route path="/tables" element={<TablesPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
