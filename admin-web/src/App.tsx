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
import { RoleProtectedRoute } from './components/auth/RoleProtectedRoute'
import {
  canAccessAdminManagerPages,
  DASHBOARD_ENABLED,
  DEFAULT_AUTHENTICATED_HOME,
  PROMOTIONS_ENABLED,
} from './utils/permissions'
import SettingsPage from './features/settings/pages/SettingsPage'
import ProfilePage from './features/settings/pages/ProfilePage'
import AccountPage from './features/settings/pages/AccountPage'
import { useEffect } from 'react'
import { socketService } from './services/socketService'

function App() {
  const { isAuthenticated } = useAuthStore()

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token')
      const socket = socketService.connect(token || undefined)
      
      // ✅ Đảm bảo join admin room
      if (socket && socket.connected) {
        socket.emit('join:admin')
        console.log('👨‍💼 Joined admin room')
      } else {
        // Đợi kết nối xong rồi join
        socket?.on('connect', () => {
          socket.emit('join:admin')
          console.log('👨‍💼 Joined admin room after connect')
        })
      }
      
      return () => {
        // Don't disconnect on unmount, keep connection alive
      }
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
        {DASHBOARD_ENABLED ? (
          <Route path="/" element={<DashboardPage />} />
        ) : (
          <>
            <Route
              path="/"
              element={<Navigate to={DEFAULT_AUTHENTICATED_HOME} replace />}
            />
            <Route
              path="/dashboard"
              element={<Navigate to={DEFAULT_AUTHENTICATED_HOME} replace />}
            />
          </>
        )}
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/orders" element={<OrdersPageWebSocket />} />
        <Route path="/tables" element={<TablesPage />} />
        <Route
          path="/inventory"
          element={
            <RoleProtectedRoute allow={canAccessAdminManagerPages}>
              <InventoryPage />
            </RoleProtectedRoute>
          }
        />
        {PROMOTIONS_ENABLED ? (
          <Route path="/promotions" element={<PromotionsPage />} />
        ) : (
          <Route
            path="/promotions"
            element={<Navigate to={DEFAULT_AUTHENTICATED_HOME} replace />}
          />
        )}
        <Route
          path="/reports"
          element={
            <RoleProtectedRoute allow={canAccessAdminManagerPages}>
              <ReportsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <RoleProtectedRoute allow={canAccessAdminManagerPages}>
              <StaffPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route
          path="*"
          element={<Navigate to={DEFAULT_AUTHENTICATED_HOME} replace />}
        />
      </Routes>
    </Layout>
  )
}

export default App
