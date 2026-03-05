/**
 * AuthStore Tests
 * 认证状态管理测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../authStore'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isGuest: false,
    })
  })

  it('should have correct initial state', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isGuest).toBe(false)
  })

  it('should set auth correctly', () => {
    const { setAuth } = useAuthStore.getState()
    const mockUser = {
      id: '123',
      anonymous_id: 'test_user',
      risk_level: 'green',
      created_at: '2024-01-01',
    }

    setAuth('test-token', mockUser)

    const state = useAuthStore.getState()
    expect(state.token).toBe('test-token')
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.isGuest).toBe(false)
  })

  it('should detect guest user', () => {
    const { setAuth } = useAuthStore.getState()
    const guestUser = {
      id: '123',
      anonymous_id: 'guest_user',
      risk_level: 'green',
      created_at: '2024-01-01',
      is_guest: true,
      guest_expires_at: '2024-12-31',
    }

    setAuth('guest-token', guestUser)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.isGuest).toBe(true)
  })

  it('should logout correctly', () => {
    const { setAuth, logout } = useAuthStore.getState()
    const mockUser = {
      id: '123',
      anonymous_id: 'test_user',
      risk_level: 'green',
      created_at: '2024-01-01',
    }

    setAuth('test-token', mockUser)
    logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isGuest).toBe(false)
  })

  it('should handle guestLogin', () => {
    const { guestLogin } = useAuthStore.getState()
    const guestUser = {
      id: '456',
      anonymous_id: 'guest_123',
      risk_level: 'green',
      created_at: '2024-01-01',
    }

    guestLogin('guest-token', guestUser)

    const state = useAuthStore.getState()
    expect(state.token).toBe('guest-token')
    expect(state.user).toEqual(guestUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.isGuest).toBe(true)
  })
})