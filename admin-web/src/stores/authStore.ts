import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'staff'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User, token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // TODO: Call API
        // Mock login for now
        if (email === 'admin@gourmet.com' && password === 'admin123') {
          const user: User = {
            id: '1',
            email: 'admin@gourmet.com',
            name: 'Admin User',
            role: 'admin',
          }
          const token = 'mock-jwt-token'
          set({ user, token, isAuthenticated: true })
        } else {
          throw new Error('Invalid credentials')
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user: User, token: string) => {
        set({ user, token, isAuthenticated: true })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
