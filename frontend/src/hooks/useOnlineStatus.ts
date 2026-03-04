/**
 * useOnlineStatus Hook
 * 网络连接状态检测 Hook
 */

import { useState, useEffect } from 'react'

export type OnlineStatus = 'online' | 'offline'

interface UseOnlineStatusReturn {
  isOnline: boolean
  status: OnlineStatus
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    status: isOnline ? 'online' : 'offline'
  }
}

export default useOnlineStatus