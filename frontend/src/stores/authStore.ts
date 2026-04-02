import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authStorage } from '../services/zustandIndexedDBStorage'

interface User {
  id: string | number
  anonymous_id: string
  nickname?: string
  risk_level: string
  created_at?: string
  is_guest?: boolean
  guest_expires_at?: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isGuest: boolean
  isLocalMode: boolean
  _hasHydrated: boolean
  setAuth: (token: string, user: User) => void
  logout: () => void
  guestLogin: (token: string, user: User) => void
  setLocalMode: (user: User) => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLocalMode: false,
      _hasHydrated: false,
      setAuth: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          isGuest: user.is_guest || false,
          isLocalMode: false,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isGuest: false,
          isLocalMode: false,
        }),
      guestLogin: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          isGuest: true,
          isLocalMode: false,
        }),
      setLocalMode: (user) =>
        set({
          token: 'local-mode-token',
          user,
          isAuthenticated: true,
          isGuest: false,
          isLocalMode: true,
        }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'heartmirror-auth',
      // 使用 IndexedDB 存储
      storage: createJSONStorage(() => authStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)