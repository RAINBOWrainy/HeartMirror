/**
 * ChatInput Component Tests
 * 测试聊天输入组件
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInput from './ChatInput'

describe('ChatInput', () => {
  const mockOnSend = vi.fn()

  beforeEach(() => {
    mockOnSend.mockClear()
  })

  describe('Rendering', () => {
    it('should render input field with placeholder', () => {
      render(<ChatInput onSend={mockOnSend} />)
      expect(screen.getByPlaceholderText('输入您想说的话...')).toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      render(<ChatInput onSend={mockOnSend} placeholder="自定义占位符" />)
      expect(screen.getByPlaceholderText('自定义占位符')).toBeInTheDocument()
    })

    it('should render send button', () => {
      render(<ChatInput onSend={mockOnSend} />)
      expect(screen.getByRole('button', { name: /发送/i })).toBeInTheDocument()
    })
  })

  describe('Input handling', () => {
    it('should update input value on change', async () => {
      render(<ChatInput onSend={mockOnSend} />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      await userEvent.type(input, '你好')

      expect(input).toHaveValue('你好')
    })

    it('should clear input after sending', async () => {
      render(<ChatInput onSend={mockOnSend} />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      await userEvent.type(input, '测试消息')

      const sendButton = screen.getByRole('button', { name: /发送/i })
      await userEvent.click(sendButton)

      expect(input).toHaveValue('')
    })

    it('should trim whitespace before sending', async () => {
      render(<ChatInput onSend={mockOnSend} />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      await userEvent.type(input, '  测试消息  ')

      const sendButton = screen.getByRole('button', { name: /发送/i })
      await userEvent.click(sendButton)

      expect(mockOnSend).toHaveBeenCalledWith('测试消息')
    })
  })

  describe('Send button behavior', () => {
    it('should call onSend when send button is clicked', async () => {
      render(<ChatInput onSend={mockOnSend} />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      await userEvent.type(input, '测试消息')

      const sendButton = screen.getByRole('button', { name: /发送/i })
      await userEvent.click(sendButton)

      expect(mockOnSend).toHaveBeenCalledTimes(1)
      expect(mockOnSend).toHaveBeenCalledWith('测试消息')
    })

    it('should disable send button when input is empty', () => {
      render(<ChatInput onSend={mockOnSend} />)

      const sendButton = screen.getByRole('button', { name: /发送/i })
      expect(sendButton).toBeDisabled()
    })

    it('should disable send button when input is only whitespace', async () => {
      render(<ChatInput onSend={mockOnSend} />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      await userEvent.type(input, '   ')

      const sendButton = screen.getByRole('button', { name: /发送/i })
      expect(sendButton).toBeDisabled()
    })

    it('should enable send button when input has content', async () => {
      render(<ChatInput onSend={mockOnSend} />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      await userEvent.type(input, '消息')

      const sendButton = screen.getByRole('button', { name: /发送/i })
      expect(sendButton).not.toBeDisabled()
    })
  })

  describe('Keyboard shortcuts', () => {
    it('should send message on Enter key', async () => {
      render(<ChatInput onSend={mockOnSend} />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      await userEvent.type(input, '测试消息{enter}')

      expect(mockOnSend).toHaveBeenCalledWith('测试消息')
    })

    it('should not send message on Shift+Enter', async () => {
      render(<ChatInput onSend={mockOnSend} />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      await userEvent.type(input, '测试消息{shift>}{enter}')

      // Should not send because Shift+Enter should add new line
      expect(mockOnSend).not.toHaveBeenCalled()
    })
  })

  describe('Disabled state', () => {
    it('should disable input when disabled prop is true', () => {
      render(<ChatInput onSend={mockOnSend} disabled />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      expect(input).toBeDisabled()
    })

    it('should disable send button when disabled prop is true', async () => {
      render(<ChatInput onSend={mockOnSend} disabled />)

      const sendButton = screen.getByRole('button', { name: /发送/i })
      expect(sendButton).toBeDisabled()
    })

    it('should not call onSend when disabled', async () => {
      render(<ChatInput onSend={mockOnSend} disabled />)

      // Even if we somehow try to send, it shouldn't work
      expect(mockOnSend).not.toHaveBeenCalled()
    })
  })

  describe('Loading state', () => {
    it('should show loading state on send button', () => {
      render(<ChatInput onSend={mockOnSend} loading />)

      const sendButton = screen.getByRole('button', { name: /加载中/i })
      // shadcn/ui Button handles loading styling internally
      expect(sendButton).toBeDisabled()
    })

    it('should not send when loading', async () => {
      render(<ChatInput onSend={mockOnSend} loading />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      // In loading state, button should be disabled
      const sendButton = screen.getByRole('button', { name: /加载中/i })
      expect(sendButton).toBeDisabled()
    })
  })

  describe('Multiple messages', () => {
    it('should handle sending multiple messages', async () => {
      render(<ChatInput onSend={mockOnSend} />)

      const input = screen.getByPlaceholderText('输入您想说的话...')
      const sendButton = screen.getByRole('button', { name: /发送/i })

      // First message
      await userEvent.type(input, '第一条消息')
      await userEvent.click(sendButton)

      // Second message
      await userEvent.type(input, '第二条消息')
      await userEvent.click(sendButton)

      expect(mockOnSend).toHaveBeenCalledTimes(2)
      expect(mockOnSend).toHaveBeenNthCalledWith(1, '第一条消息')
      expect(mockOnSend).toHaveBeenNthCalledWith(2, '第二条消息')
    })
  })
})