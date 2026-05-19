import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Users,
  Gift,
  Table,
  BarChart3,
  Package,
  type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import {
  canAccessAdminManagerPages,
  DASHBOARD_ENABLED,
  PROMOTIONS_ENABLED,
} from '../../utils/permissions'

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  requiresAdminManager?: boolean
}

const navigation: NavItem[] = [
  ...(DASHBOARD_ENABLED
    ? [{ name: 'Dashboard', href: '/', icon: LayoutDashboard }]
    : []),
  { name: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { name: 'Đơn hàng', href: '/orders', icon: ShoppingCart },
  { name: 'Bàn', href: '/tables', icon: Table },
  {
    name: 'Kho',
    href: '/inventory',
    icon: Package,
    requiresAdminManager: true,
  },
  ...(PROMOTIONS_ENABLED
    ? [{ name: 'Khuyến mãi', href: '/promotions', icon: Gift }]
    : []),
  {
    name: 'Báo cáo',
    href: '/reports',
    icon: BarChart3,
    requiresAdminManager: true,
  },
  {
    name: 'Nhân viên',
    href: '/staff',
    icon: Users,
    requiresAdminManager: true,
  },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const showAdminManagerNav = canAccessAdminManagerPages(user?.roles, user?.role)

  const visibleNavigation = navigation.filter(
    (item) => !item.requiresAdminManager || showAdminManagerNav
  )

  return (
    <div className="w-64 bg-[#F6F3F2] border-r border-stone-200/20 flex flex-col">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-stone-200/20">
        <div className="w-10 h-10 rounded-full bg-[#AD2C00] flex items-center justify-center text-white">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-black text-stone-900 leading-tight">Gourmet Tech</h2>
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Quản Trị Viên</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {visibleNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-stone-200/50 p-4">
        <p className="text-xs text-stone-500 text-center">© 2026 Gourmet Tech</p>
      </div>
    </div>
  )
}
