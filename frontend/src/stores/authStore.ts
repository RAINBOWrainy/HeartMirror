import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  anonymous_id: string
  risk_level: string
  created_at: string
  is_guest?: boolean
  guest_expires_at?: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isGuest: boolean
  _hasHydrated: boolean
  setAuth: (token: string, user: User) => void
  logout: () => void
  guestLogin: (token: string, user: User) => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isGuest: false,
      _hasHydrated: false,
      setAuth: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          isGuest: user.is_guest || false,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isGuest: false,
        }),
      guestLogin: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
          isGuest: true,
        }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'heartmirror-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)