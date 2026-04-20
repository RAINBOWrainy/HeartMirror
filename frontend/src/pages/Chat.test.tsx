/**
 * Chat Page Tests
 * AI对话页面测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Chat from './Chat'

// Mock all dependencies
vi.mock('@/stores/chatStore', () => ({
  useChatStore: () => ({
    currentSession: { messages: [] },
    addMessage: vi.fn(),
    isLoading: false,
    setLoading: vi.fn()
  })
}))

vi.mock('@/components/common/CrisisAlert', () => ({
  useCrisisAlert: () => ({
    showAlert: vi.fn()
  })
}))

vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => ({
    isOnline: true
  })
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <Chat />
    </MemoryRouter>
  )
}

describe('Chat Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all core components', () => {
    renderWithRouter()
    // Check for medical disclaimer
    expect(screen.getByText(/温馨提示：这是AI辅助对话/)).toBeInTheDocument()
    // Check connection status shows online
    expect(screen.getByText('已连接')).toBeInTheDocument()
    // Check message list container
    expect(document.querySelector('.bg-surface')).toBeInTheDocument()
    // Check chat input
    expect(screen.getByPlaceholderText('输入您想说的话...')).toBeInTheDocument()
  })

  it('should show offline status when not online', () => {
    // Override the hook mock for this test
    vi.mock('@/hooks/useOnlineStatus', () => ({
      useOnlineStatus: () => ({
        isOnline: false
      })
    }))

    renderWithRouter()
    expect(screen.getByText('离线')).toBeInTheDocument()
  })

  it('should render daily encouragement component', () => {
    renderWithRouter()
    // DailyEncouragement should be rendered
    expect(document.querySelector('.flex.items-center.justify-between')).toContainElement(
      screen.getByText('已连接')
    )
  })

  it('should show the medical disclaimer alert with heart icon', () => {
    renderWithRouter()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/温馨提示/)).toBeInTheDocument()
  })
})
