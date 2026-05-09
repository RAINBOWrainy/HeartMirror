'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { deriveKey, generateSalt, encryptDEK, createPasswordVerifier, toBase64, fromBase64 } from '@/lib/crypto/client'

interface User {
  id: string
  email: string
  emailVerified: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

const AUTH_TOKEN_KEY = 'heartmirror_auth_token'
const USER_DATA_KEY = 'heartmirror_user_data'
const DEK_CACHE_KEY = 'heartmirror_dek'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY)
        const userData = localStorage.getItem(USER_DATA_KEY)
        if (token && userData) {
          setUser(JSON.parse(userData))
        }
      } catch {
        // Invalid stored data
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(USER_DATA_KEY)
      }
      setIsLoading(false)
    }
    loadUser()
  }, [])

  // Check if user is authenticated with server
  const checkAuth = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return false

    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        logout()
        return false
      }
      const data = await res.json()
      setUser(data.user)
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user))
      return true
    } catch {
      return false
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Get salt from server
      const saltRes = await fetch(`/api/auth/salt?email=${encodeURIComponent(email)}`)
      const { salt: saltBase64 } = await saltRes.json()
      const salt = fromBase64(saltBase64)

      // Derive key from password
      const kek = await deriveKey(password, salt)

      // Get encrypted DEK from server (need to fetch user data first)
      // For now, we'll do a simple login without DEK
      const derivedKeyHash = toBase64(new Uint8Array(await crypto.subtle.exportKey('raw', kek)).slice(0, 16))

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          derivedKeyHash,
          encryptedDek: '', // Will be fetched after initial login
          dekIv: '',
          dekAuthTag: '',
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await res.json()

      // Store token and user data
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      localStorage.setItem(USER_DATA_KEY, JSON.stringify({
        id: data.userId,
        email,
        emailVerified: data.emailVerified,
      }))

      setUser({
        id: data.userId,
        email,
        emailVerified: data.emailVerified,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Generate salt for KEK derivation
      const salt = generateSalt()

      // Derive KEK from password
      const kek = await deriveKey(password, salt)

      // Generate DEK for encrypting user data
      const dek = crypto.getRandomValues(new Uint8Array(32))

      // Encrypt DEK with KEK
      const { encryptedDek, iv, tag } = await encryptDEK(dek, kek)

      // Create password verifier
      const { expectedHash } = await createPasswordVerifier(kek)

      // Store DEK in localStorage (encrypted with password)
      const dekContainer = {
        encryptedDek: toBase64(encryptedDek),
        iv: toBase64(iv),
        tag: toBase64(tag),
      }
      localStorage.setItem(DEK_CACHE_KEY, JSON.stringify(dekContainer))

      // Send to server
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          encryptedDek: toBase64(encryptedDek),
          dekSalt: toBase64(salt),
          dekIv: toBase64(iv),
          dekAuthTag: toBase64(tag),
          passwordVerifier: toBase64(expectedHash),
          salt: toBase64(salt),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Signup failed')
      }

      const data = await res.json()

      // Store token and user data
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      localStorage.setItem(USER_DATA_KEY, JSON.stringify({
        id: data.userId,
        email,
        emailVerified: data.emailVerified,
      }))

      setUser({
        id: data.userId,
        email,
        emailVerified: data.emailVerified,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_DATA_KEY)
    localStorage.removeItem(DEK_CACHE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Helper to get auth token
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

// Helper to get DEK cache key for a user
export function getDEKCacheKey(userId: string): string {
  return `heartmirror_dek_${userId}`
}