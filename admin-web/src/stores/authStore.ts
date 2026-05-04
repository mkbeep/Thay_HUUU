import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'staff'
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
        // Check registered users first
        const registeredUsers = JSON.parse(localStorage.getItem('registered-users') || '[]')
        const foundUser = registeredUsers.find((u: any) => u.email === email && u.password === password)
        
        if (foundUser) {
          const user: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: foundUser.email,
            name: foundUser.name,
            role: 'manager',
            phone: foundUser.phone,
            position: 'Quản lý',
            joinedDate: new Date().toISOString().split('T')[0]
          }
          const token = 'mock-jwt-token-' + user.id
          set({ user, token, isAuthenticated: true })
          return
        }
        
        // Check default admin account
        if (email === 'admin@gourmet.com' && password === 'admin123') {
          const user: User = {
            id: '1',
            email: 'admin@gourmet.com',
            name: 'Admin User',
            role: 'admin',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCznXIT2M2jGQTSPmUDv6ehnbXsyBDkJKZXBkXu0nGV0gNOdFs04N22RveuUGsej1T1kgffMRLS-PcV31O3qNEXzK8rToKxV5t5gU0vEDt1oNiEJKnlcFvcEomQBKN9KzYDBgEEj0HcP8ai8juyIEujPg_kAVSdC1U9uazsGlD3i0HeDNVdQALfPlebOgXJWwLy0kfoRLMDHrWZu0UWSeyaf4be0dLwmEoB7BHv0_96ocKYLGfF4CWIK569lWLKgBrytOAng44FYQ',
            phone: '0901234567',
            position: 'Quản trị viên hệ thống',
            joinedDate: '2024-01-15'
          }
          const token = 'mock-jwt-token'
          set({ user, token, isAuthenticated: true })
          return
        }
        
        throw new Error('Invalid credentials')
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user: User, token: string) => {
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
