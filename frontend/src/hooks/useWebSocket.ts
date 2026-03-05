/**
 * useWebSocket Hook
 * WebSocket 连接管理 Hook
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'error'
  content: string
  emotion_detected?: string
  emotion_intensity?: number
  risk_level?: string
  stage?: string
}

interface UseWebSocketOptions {
  sessionId: string
  onMessage?: (data: WebSocketMessage) => void
  onTyping?: () => void
  onError?: (error: string) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnectAttempts?: number
  reconnectInterval?: number
  heartbeatInterval?: number
}

interface UseWebSocketReturn {
  status: WebSocketStatus
  send: (content: string) => void
  disconnect: () => void
  reconnect: () => void
}

const getWebSocketUrl = (sessionId: string, token?: string): string => {
  // 从环境变量获取 API URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

  // 转换为 WebSocket URL
  const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws'
  // 移除协议前缀和 /api 后缀
  let wsHost = apiUrl.replace(/^https?:\/\//, '')
  // WebSocket 端点在根路径下，不是 /api 下
  wsHost = wsHost.replace(/\/api$/, '')

  // 构建 URL，如果有 token 则添加到 query 参数
  let url = `${wsProtocol}://${wsHost}/api/chat/ws/${sessionId}`
  if (token) {
    url += `?token=${encodeURIComponent(token)}`
  }

  console.log('[WebSocket] Connecting to:', url)
  return url
}

export function useWebSocket({
  sessionId,
  onMessage,
  onTyping,
  onError,
  onConnect,
  onDisconnect,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  heartbeatInterval = 30000
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { user, token } = useAuthStore()

  // 清理心跳定时器
  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
  }, [])

  // 开始心跳
  const startHeartbeat = useCallback(() => {
    clearHeartbeat()
    heartbeatTimerRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, heartbeatInterval)
  }, [heartbeatInterval, clearHeartbeat])

  // 连接 WebSocket
  const connect = useCallback(() => {
    if (!sessionId) return

    // 清理现有连接
    if (socketRef.current) {
      socketRef.current.close()
    }

    setStatus('connecting')

    const wsUrl = getWebSocketUrl(sessionId, token || undefined)
    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    socket.onopen = () => {
      setStatus('connected')
      reconnectCountRef.current = 0
      startHeartbeat()
      onConnect?.()
    }

    socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)

        switch (data.type) {
          case 'message':
            onMessage?.(data)
            break
          case 'typing':
            onTyping?.()
            break
          case 'error':
            onError?.(data.content)
            break
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setStatus('error')
      onError?.('连接发生错误')
    }

    socket.onclose = (event) => {
      setStatus('disconnected')
      clearHeartbeat()
      onDisconnect?.()

      // 非正常关闭时尝试重连
      if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
        reconnectCountRef.current++
        console.log(`Attempting to reconnect (${reconnectCountRef.current}/${reconnectAttempts})...`)

        reconnectTimerRef.current = setTimeout(() => {
          connect()
        }, reconnectInterval)
      }
    }
  }, [sessionId, token, onConnect, onDisconnect, onMessage, onTyping, onError, reconnectAttempts, reconnectInterval, startHeartbeat, clearHeartbeat])

  // 发送消息
  const send = useCallback((content: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        content,
        user_id: user?.id
      }))
    } else {
      console.warn('WebSocket is not connected')
      onError?.('连接未建立，请稍后重试')
    }
  }, [user?.id, onError])

  // 断开连接
  const disconnect = useCallback(() => {
    clearHeartbeat()
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnect')
      socketRef.current = null
    }
    setStatus('disconnected')
  }, [clearHeartbeat])

  // 手动重连
  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0
    connect()
  }, [connect])

  // 组件挂载时连接，卸载时断开
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // 页面可见性变化时重连
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'disconnected') {
        reconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [status, reconnect])

  return {
    status,
    send,
    disconnect,
    reconnect
  }
}

export default useWebSocket