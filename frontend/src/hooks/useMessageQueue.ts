/**
 * useMessageQueue Hook
 * 消息队列管理 Hook - 用于离线时缓存消息
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export interface QueuedMessage {
  id: string
  content: string
  timestamp: Date
  retryCount: number
}

interface UseMessageQueueOptions {
  maxQueueSize?: number
  maxRetryCount?: number
  storageKey?: string
}

interface UseMessageQueueReturn {
  queue: QueuedMessage[]
  enqueue: (content: string) => QueuedMessage
  dequeue: () => QueuedMessage | undefined
  remove: (id: string) => void
  clear: () => void
  peek: () => QueuedMessage | undefined
  size: number
  isEmpty: boolean
}

const STORAGE_KEY = 'heartmirror_message_queue'

export function useMessageQueue({
  maxQueueSize = 50,
  maxRetryCount = 3,
  storageKey = STORAGE_KEY
}: UseMessageQueueOptions = {}): UseMessageQueueReturn {
  const [queue, setQueue] = useState<QueuedMessage[]>(() => {
    // 从 localStorage 恢复队列
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }
    } catch (e) {
      console.error('Failed to restore message queue:', e)
    }
    return []
  })

  // 持久化队列到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(queue))
    } catch (e) {
      console.error('Failed to persist message queue:', e)
    }
  }, [queue, storageKey])

  // 入队
  const enqueue = useCallback((content: string): QueuedMessage => {
    const message: QueuedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      timestamp: new Date(),
      retryCount: 0
    }

    setQueue(prev => {
      const newQueue = [...prev, message]
      // 限制队列大小
      if (newQueue.length > maxQueueSize) {
        return newQueue.slice(-maxQueueSize)
      }
      return newQueue
    })

    return message
  }, [maxQueueSize])

  // 出队
  const dequeue = useCallback((): QueuedMessage | undefined => {
    let dequeuedMessage: QueuedMessage | undefined

    setQueue(prev => {
      if (prev.length === 0) return prev

      const [first, ...rest] = prev

      // 检查重试次数
      if (first.retryCount >= maxRetryCount) {
        // 超过最大重试次数，移除消息
        console.warn(`Message ${first.id} exceeded max retry count, removing`)
        return rest
      }

      // 增加重试计数
      dequeuedMessage = { ...first, retryCount: first.retryCount + 1 }
      return rest
    })

    return dequeuedMessage
  }, [maxRetryCount])

  // 移除指定消息
  const remove = useCallback((id: string) => {
    setQueue(prev => prev.filter(msg => msg.id !== id))
  }, [])

  // 清空队列
  const clear = useCallback(() => {
    setQueue([])
    localStorage.removeItem(storageKey)
  }, [storageKey])

  // 查看队首消息
  const peek = useCallback((): QueuedMessage | undefined => {
    return queue[0]
  }, [queue])

  return {
    queue,
    enqueue,
    dequeue,
    remove,
    clear,
    peek,
    size: queue.length,
    isEmpty: queue.length === 0
  }
}

export default useMessageQueue