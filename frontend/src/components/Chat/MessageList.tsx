/**
 * MessageList Component with Virtual Scrolling
 * 消息列表组件 - 使用 Tailwind + react-window
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { List, useDynamicRowHeight } from 'react-window'
import type { ListImperativeAPI } from 'react-window'
import type { Message } from '@/stores/chatStore'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
  height?: number
}

// 消息项最小高度
const MIN_MESSAGE_HEIGHT = 80
const LOADING_INDICATOR_HEIGHT = 60

/**
 * 估算单条消息的高度
 */
const estimateMessageHeight = (message: Message, containerWidth: number = 600): number => {
  const contentLength = message.content.length
  const ESTIMATED_LINE_HEIGHT = 24
  const ESTIMATED_CHAR_WIDTH = 14
  const MAX_MESSAGE_WIDTH_RATIO = 0.8

  const availableWidth = containerWidth * MAX_MESSAGE_WIDTH_RATIO
  const estimatedLines = Math.ceil((contentLength * ESTIMATED_CHAR_WIDTH) / availableWidth)
  const textHeight = estimatedLines * ESTIMATED_LINE_HEIGHT
  const finalHeight = Math.max(MIN_MESSAGE_HEIGHT, MIN_MESSAGE_HEIGHT + textHeight - ESTIMATED_LINE_HEIGHT)

  return finalHeight
}

interface RowProps {
  messages: Message[]
  isLoading: boolean
  loadingText?: string
  containerWidth: number
}

// 行渲染组件
const MessageRow = ({
  index,
  style,
  messages,
  isLoading,
  loadingText,
}: {
  index: number
  style: React.CSSProperties
} & RowProps): React.ReactElement | null => {
  if (index === messages.length && isLoading) {
    return (
      <div style={style}>
        <TypingIndicator text={loadingText} />
      </div>
    )
  }

  const message = messages[index]
  if (!message) return null

  return (
    <div style={style}>
      <MessageItem message={message} />
    </div>
  )
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  loadingText,
  emptyText = '开始您的对话吧',
  height
}) => {
  const listRef = useRef<ListImperativeAPI>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = React.useState(height || 400)
  const [containerWidth, setContainerWidth] = React.useState(600)

  // 监听容器尺寸变化
  useEffect(() => {
    if (height) {
      setContainerHeight(height)
      return
    }

    const container = containerRef.current?.parentElement
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height - 32
        const newWidth = entry.contentRect.width
        if (newHeight > 0) {
          setContainerHeight(newHeight)
          setContainerWidth(newWidth)
        }
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [height])

  // 动态行高度hook
  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: MIN_MESSAGE_HEIGHT,
    key: 'message-list'
  })

  // 计算行高度函数
  const getRowHeight = useCallback((index: number, rowProps: RowProps): number => {
    const { messages, isLoading, containerWidth } = rowProps

    if (index === messages.length && isLoading) {
      return LOADING_INDICATOR_HEIGHT
    }

    const measuredHeight = dynamicRowHeight.getRowHeight(index)
    if (measuredHeight !== undefined) {
      return measuredHeight
    }

    const message = messages[index]
    if (!message) return MIN_MESSAGE_HEIGHT

    return estimateMessageHeight(message, containerWidth)
  }, [dynamicRowHeight])

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      listRef.current.scrollToRow({
        index: messages.length,
        align: 'end',
        behavior: 'smooth'
      })
    }
  }, [messages.length, isLoading])

  // 行props
  const rowProps = useMemo<RowProps>(() => ({
    messages,
    isLoading,
    loadingText,
    containerWidth
  }), [messages, isLoading, loadingText, containerWidth])

  // 总行数
  const rowCount = useMemo(() => {
    return messages.length + (isLoading ? 1 : 0)
  }, [messages.length, isLoading])

  // 空状态
  if (messages.length === 0 && !isLoading) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center h-full"
      >
        <p className="text-muted-foreground">{emptyText}</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
    >
      <List
        listRef={listRef}
        rowCount={rowCount}
        rowHeight={getRowHeight}
        rowComponent={MessageRow}
        rowProps={rowProps}
        style={{
          height: containerHeight,
          width: '100%',
          padding: '8px 16px'
        }}
        overscanCount={5}
      />
    </div>
  )
}

export default MessageList