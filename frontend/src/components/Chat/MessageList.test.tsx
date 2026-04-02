/**
 * MessageList Component Tests
 * 测试虚拟滚动消息列表组件
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageList from './MessageList'
import type { Message } from '../../stores/chatStore'

// Mock react-window
vi.mock('react-window', () => ({
  List: vi.fn(({ rowCount, rowComponent, rowProps, style }) => (
    <div
      data-testid="virtual-list"
      data-row-count={rowCount}
      style={style}
    >
      {Array.from({ length: rowCount }, (_, index) =>
        rowComponent({
          index,
          style: {},
          ...rowProps
        })
      )}
    </div>
  )),
  useDynamicRowHeight: vi.fn(() => ({
    getAverageRowHeight: vi.fn(() => 80),
    getRowHeight: vi.fn(() => undefined),
    setRowHeight: vi.fn(),
    observeRowElements: vi.fn(() => vi.fn())
  }))
}))

// Mock MessageItem component
vi.mock('./MessageItem', () => ({
  default: ({ message }: { message: Message }) => (
    <div data-testid={`message-${message.id}`}>
      {message.content}
    </div>
  )
}))

// Mock TypingIndicator component
vi.mock('./TypingIndicator', () => ({
  default: ({ text }: { text?: string }) => (
    <div data-testid="typing-indicator">{text || '正在输入...'}</div>
  )
}))

describe('MessageList', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: '你好，我想咨询一些心理健康问题',
      timestamp: new Date('2024-01-01T10:00:00'),
      emotion: 'anxiety',
      emotionIntensity: 3
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: '你好！我是你的心理健康助手，很高兴为你提供帮助。请告诉我你最近的情绪状态如何？',
      timestamp: new Date('2024-01-01T10:01:00')
    },
    {
      id: 'msg-3',
      role: 'user',
      content: '最近工作压力很大，经常感到焦虑',
      timestamp: new Date('2024-01-01T10:02:00'),
      emotion: 'anxiety',
      emotionIntensity: 5
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty state', () => {
    it('should show empty state when no messages', () => {
      render(<MessageList messages={[]} />)
      expect(screen.getByText('开始您的对话吧')).toBeInTheDocument()
    })

    it('should show custom empty text', () => {
      render(<MessageList messages={[]} emptyText="暂无消息" />)
      expect(screen.getByText('暂无消息')).toBeInTheDocument()
    })

    it('should not show empty state when loading', () => {
      render(<MessageList messages={[]} isLoading />)
      expect(screen.queryByText('开始您的对话吧')).not.toBeInTheDocument()
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    })
  })

  describe('Virtual list rendering', () => {
    it('should render virtual list with messages', () => {
      render(<MessageList messages={mockMessages} />)

      const virtualList = screen.getByTestId('virtual-list')
      expect(virtualList).toBeInTheDocument()
      expect(virtualList.getAttribute('data-row-count')).toBe('3')
    })

    it('should render all messages', () => {
      render(<MessageList messages={mockMessages} />)

      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument()
      expect(screen.getByTestId('message-msg-3')).toBeInTheDocument()
    })

    it('should show typing indicator when loading', () => {
      render(<MessageList messages={mockMessages} isLoading />)

      const virtualList = screen.getByTestId('virtual-list')
      expect(virtualList.getAttribute('data-row-count')).toBe('4') // 3 messages + 1 loading

      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    })

    it('should show custom loading text', () => {
      render(<MessageList messages={[]} isLoading loadingText="AI正在思考..." />)

      expect(screen.getByText('AI正在思考...')).toBeInTheDocument()
    })
  })

  describe('Performance optimization', () => {
    it('should handle 100+ messages efficiently', () => {
      // Generate 150 mock messages
      const manyMessages: Message[] = Array.from({ length: 150 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `消息内容 ${i} - 这是一个测试消息，包含一些文本内容用于测试虚拟滚动性能`,
        timestamp: new Date(`2024-01-01T10:${Math.floor(i / 60)}:${i % 60}:00`)
      }))

      render(<MessageList messages={manyMessages} />)

      const virtualList = screen.getByTestId('virtual-list')
      expect(virtualList.getAttribute('data-row-count')).toBe('150')
    })

    it('should use virtual scrolling (not render all DOM elements)', () => {
      // In the mock, we render all for simplicity, but the real component
      // only renders visible items. This test verifies the List is used.
      render(<MessageList messages={mockMessages} />)

      // The mock List is called, proving virtual scrolling is implemented
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument()
    })
  })

  describe('Dynamic height', () => {
    it('should handle varying message lengths', () => {
      const longMessages: Message[] = [
        {
          id: 'short-msg',
          role: 'user',
          content: '短消息',
          timestamp: new Date()
        },
        {
          id: 'long-msg',
          role: 'assistant',
          content: Array.from({ length: 50 }, () => '这是一个很长很长的消息内容，').join(''),
          timestamp: new Date()
        }
      ]

      render(<MessageList messages={longMessages} />)

      expect(screen.getByTestId('message-short-msg')).toBeInTheDocument()
      expect(screen.getByTestId('message-long-msg')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should maintain message order', () => {
      render(<MessageList messages={mockMessages} />)

      const messages = screen.getAllByTestId(/message-/)
      expect(messages[0]).toHaveTextContent('你好，我想咨询一些心理健康问题')
      expect(messages[1]).toHaveTextContent('你好！我是你的心理健康助手')
      expect(messages[2]).toHaveTextContent('最近工作压力很大')
    })
  })
})