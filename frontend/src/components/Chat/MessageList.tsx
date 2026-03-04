/**
 * MessageList Component
 * 消息列表组件
 */

import React, { useRef, useEffect } from 'react'
import { Card, Empty } from 'antd'
import type { Message } from '../../stores/chatStore'
import MessageItem from './MessageItem'
import TypingIndicator from './TypingIndicator'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  loadingText?: string
  emptyText?: string
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  loadingText,
  emptyText = '开始您的对话吧'
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
      }}>
        <Empty
          description={emptyText}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: '16px 0'
      }}
    >
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      {isLoading && <TypingIndicator text={loadingText} />}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default MessageList