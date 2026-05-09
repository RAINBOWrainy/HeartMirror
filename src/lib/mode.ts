/**
 * Mode detection and switching utilities
 * HeartMirror supports two modes:
 * - Local: Browser-only with localStorage, no account required
 * - Cloud: Server-hosted with account, data synced
 */

export type Mode = 'local' | 'cloud'

const MODE_STORAGE_KEY = 'heartmirror_mode'

/**
 * Auto-detect the current mode based on environment and storage
 */
export function detectMode(): Mode {
  if (typeof window === 'undefined') {
    // Server-side default to local
    return 'local'
  }

  // Check if user has explicitly set a mode
  const storedMode = localStorage.getItem(MODE_STORAGE_KEY)
  if (storedMode === 'local' || storedMode === 'cloud') {
    return storedMode
  }

  // Check if user has cloud auth token - implies cloud mode
  const hasAuthToken = !!localStorage.getItem('heartmirror_auth_token')
  if (hasAuthToken) {
    return 'cloud'
  }

  // Environment-based detection
  const isDeployed =
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.endsWith('.local')

  if (isDeployed) {
    // Deployed environments default to cloud but allow switching
    return 'cloud'
  }

  // Local development defaults to local mode
  return 'local'
}

/**
 * Set the current mode
 * Note: This does NOT migrate data - use the migration wizard for that
 */
export function setMode(mode: Mode): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(MODE_STORAGE_KEY, mode)
}

/**
 * Clear mode setting - triggers auto-detection on next load
 */
export function clearMode(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(MODE_STORAGE_KEY)
}

/**
 * Check if there is local data that needs migration
 */
export function hasLocalDataForMigration(): boolean {
  if (typeof window === 'undefined') return false

  // Check for password (DEK encrypted with password)
  const hasPassword = !!localStorage.getItem('heartmirror_password')

  // Check for any local storage keys that look like conversation data
  const hasConversations = Object.keys(localStorage).some(
    key => key.startsWith('conv_') || key.includes('conversation')
  )

  return hasPassword || hasConversations
}

/**
 * Get migration summary for display in wizard
 */
export function getMigrationSummary(): {
  hasLocalData: boolean
  estimatedSize: string
} {
  if (typeof window === 'undefined') {
    return { hasLocalData: false, estimatedSize: '0 KB' }
  }

  const hasData = hasLocalDataForMigration()

  // Estimate size from localStorage usage
  let totalSize = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key) || ''
      totalSize += key.length + value.length
    }
  }

  const sizeKB = Math.round(totalSize / 1024)

  return {
    hasLocalData: hasData,
    estimatedSize: sizeKB < 1000 ? `${sizeKB} KB` : `${(sizeKB / 1024).toFixed(1)} MB`,
  }
}

/**
 * Check if user is logged in (cloud mode)
 */
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('heartmirror_auth_token')
}

/**
 * Get auth token for API requests
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('heartmirror_auth_token')
}

/**
 * Set auth token (after login/signup)
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('heartmirror_auth_token', token)
}

/**
 * Clear auth token (logout)
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('heartmirror_auth_token')
  // Don't clear DEK from memory cache immediately to allow safe logout
}

/**
 * Get DEK cache key for cloud mode
 */
export function getDEKCacheKey(userId: string): string {
  return `heartmirror_dek_${userId}`
}
