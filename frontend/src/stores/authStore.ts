import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  anonymous_id: string
  risk_level: string
  created_at: string
  is_guest?: boolean
  guest_expires_at?: string
}

// 开发模式默认用户
const DEV_USER: User = {
  id: 'dev-user-001',
  anonymous_id: 'DemoUser',
  risk_level: 'green',
  created_at: new Date().toISOString(),
}

// 检查是否启用开发模式绕过
const isDevBypass = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isDevMode: boolean
  isGuest: boolean
  setAuth: (token: string, user: User) => void
  logout: () => void
  devBypassLogin: () => void
  guestLogin: (token: string, user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 开发模式下默认已认证
      token: isDevBypass ? 'dev-mock-token' : null,
      user: isDevBypass ? DEV_USER : null,
      isAuthenticated: isDevBypass,
      isDevMode: isDevBypass,
      isGuest: false,
      setAuth: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          isGuest: user.is_guest || false,
        }),
      logout: () =>
        set({
          // 开发模式下保持认证状态
          token: isDevBypass ? 'dev-mock-token' : null,
          user: isDevBypass ? DEV_USER : null,
          isAuthenticated: isDevBypass,
          isGuest: false,
        }),
      devBypassLogin: () =>
        set({
          token: 'dev-mock-token',
          user: DEV_USER,
          isAuthenticated: true,
          isDevMode: true,
          isGuest: false,
        }),
      guestLogin: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          isGuest: true,
        }),
    }),
    {
      name: 'heartmirror-auth',
    }
  )
)