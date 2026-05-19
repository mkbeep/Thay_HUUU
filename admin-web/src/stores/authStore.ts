import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  /** Role chính (hiển thị UI) */
  role: 'admin' | 'manager' | 'staff'
  /** Toàn bộ role từ backend — dùng phân quyền */
  roles?: string[]
  avatar?: string
  phone?: string
  position?: string
  joinedDate?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User, token: string) => void
  updateAvatar: (avatar: string) => void
  updateProfile: (data: Partial<User>) => void
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          // ✅ Gọi API login thật từ backend
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
          
          console.log('🔐 Attempting login to:', `${API_URL}/auth/login`)
          console.log('📧 Email:', email)
          
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          })

          console.log('📡 Response status:', response.status)

          if (!response.ok) {
            const error = await response.json()
            console.error('❌ Login error:', error)
            throw new Error(error.message || 'Login failed')
          }

          const data = await response.json()
          console.log('✅ Login response:', data)
          
          const backendRoles: string[] = data.data.user.roles || []
          const primaryRole =
            (['admin', 'manager', 'staff'] as const).find((r) =>
              backendRoles.includes(r)
            ) || backendRoles[0] || 'staff'

          const user: User = {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.full_name || data.data.user.email,
            role: primaryRole as User['role'],
            roles: backendRoles,
            phone: data.data.user.phone_number,
            avatar: data.data.user.avatar_url,
          }

          const token = data.data.access_token // ✅ Đổi từ token thành access_token

          console.log('👤 User:', user)
          console.log('🔑 Token:', token ? 'exists' : 'missing')

          // Lưu token cho toàn bộ repository/interceptor (legacy + new)
          localStorage.setItem('token', token)
          localStorage.setItem('access_token', token)
          
          set({ user, token, isAuthenticated: true })
        } catch (error: any) {
          console.error('❌ Login error:', error)
          throw new Error(error.message || 'Invalid credentials')
        }
      },

      logout: () => {
        // Xóa token khỏi localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('access_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user: User, token: string) => {
        localStorage.setItem('token', token)
        localStorage.setItem('access_token', token)
        set({ user, token, isAuthenticated: true })
      },

      updateAvatar: (avatar: string) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, avatar } })
        }
      },

      updateProfile: (data: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...data } })
        }
      },

      updatePassword: async (currentPassword: string, newPassword: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('Đổi mật khẩu từ:', currentPassword, 'sang:', newPassword)
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)
