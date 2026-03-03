/**
 * WebSocket Service
 * 实时通信服务
 */

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/chat'

export type MessageType = 'message' | 'typing' | 'error' | 'connected' | 'disconnected'

export interface WebSocketMessage {
  type: MessageType
  content: string
  emotion_detected?: string
  risk_level?: string
  stage?: string
}

export type MessageHandler = (message: WebSocketMessage) => void

class WebSocketService {
  private socket: WebSocket | null = null
  private sessionId: string | null = null
  private messageHandlers: Set<MessageHandler> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false

  /**
   * 连接WebSocket
   */
  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        resolve()
        return
      }

      this.isConnecting = true
      this.sessionId = sessionId
      const url = `${WS_BASE_URL}/ws/${sessionId}`

      try {
        this.socket = new WebSocket(url)

        this.socket.onopen = () => {
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.notifyHandlers({
            type: 'connected',
            content: ''
          })
          resolve()
        }

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage
            this.notifyHandlers(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.socket.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason)
          this.isConnecting = false
          this.notifyHandlers({
            type: 'disconnected',
            content: ''
          })

          // 尝试重连
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          this.notifyHandlers({
            type: 'error',
            content: '连接错误，请检查网络'
          })
          reject(error)
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.sessionId = null
    this.reconnectAttempts = this.maxReconnectAttempts // 阻止自动重连
  }

  /**
   * 发送消息
   */
  send(content: string, userId?: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      this.notifyHandlers({
        type: 'error',
        content: '未连接到服务器'
      })
      return
    }

    const message = {
      content,
      user_id: userId
    }

    this.socket.send(JSON.stringify(message))
  }

  /**
   * 订阅消息
   */
  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  /**
   * 通知所有处理器
   */
  private notifyHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message)
      } catch (error) {
        console.error('Handler error:', error)
      }
    })
  }

  /**
   * 调度重连
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      if (this.sessionId) {
        this.connect(this.sessionId).catch(error => {
          console.error('Reconnect failed:', error)
        })
      }
    }, delay)
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}

// 导出单例
export const wsService = new WebSocketService()
export default wsService