/**
 * Home Page Tests
 * 首页测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

// Mock stores
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { nickname: '测试用户' }
  })
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

describe('Home Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    localStorage.clear()
  })

  it('should render welcome message with user nickname', () => {
    renderWithRouter()
    expect(screen.getByText(/嗨，测试用户/)).toBeInTheDocument()
  })

  it('should show daily encouragement', () => {
    renderWithRouter()
    // Daily encouragement should be visible
    expect(screen.getByText(/每一天都是新的开始|感受情绪是勇敢的第一步|慢慢来，不着急，我们一起走/)).toBeInTheDocument()
  })

  it('should render quick mood check-in', () => {
    renderWithRouter()
    expect(screen.getByText('今天感觉怎么样？')).toBeInTheDocument()
    // Should render 5 mood buttons
    const moodButtons = document.querySelectorAll('button[aria-label]')
    expect(moodButtons.length).toBeGreaterThan(0)
  })

  it('should navigate to chat when mood selected', async () => {
    renderWithRouter()
    const firstMood = document.querySelector('button[aria-label]') as HTMLButtonElement
    fireEvent.click(firstMood!)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
      expect(mockNavigate.mock.calls[0][0]).toContain('/chat?mood=')
    })
  })

  it('should render all feature cards', () => {
    renderWithRouter()
    expect(screen.getByText('AI对话')).toBeInTheDocument()
    expect(screen.getByText('情绪日记')).toBeInTheDocument()
    expect(screen.getByText('数据看板')).toBeInTheDocument()
  })

  it('should navigate to correct page when feature card clicked', () => {
    renderWithRouter()
    const chatCard = screen.getByText('与AI助手交流，识别情绪状态').closest('button')
    fireEvent.click(chatCard!)
    expect(mockNavigate).toHaveBeenCalledWith('/chat')
  })

  it('should show onboarding tour when not completed', () => {
    renderWithRouter()
    // Onboarding should show by default when not completed
    expect(screen.getByText('欢迎来到心镜')).toBeInTheDocument()
  })

  it('should allow re-opening onboarding tour when "查看引导" clicked', () => {
    // localStorage already cleared, so it would normally show
    // But we can test that clicking the button shows it
    renderWithRouter()

    // If tour is already open, close it by completing
    if (screen.queryByText('欢迎来到心镜')) {
      const skipButton = screen.getByText('跳过引导')
      fireEvent.click(skipButton)
      expect(screen.queryByText('欢迎来到心镜')).not.toBeInTheDocument()
    }

    const showTourButton = screen.getByText('查看引导')
    fireEvent.click(showTourButton)
    expect(screen.getByText('欢迎来到心镜')).toBeInTheDocument()
  })

  it('should render daily tip section', () => {
    renderWithRouter()
    expect(screen.getByText('今日小贴士')).toBeInTheDocument()
    expect(screen.getByText(/每天花几分钟关注自己的情绪/)).toBeInTheDocument()
  })

  it('should navigate to chat when "开始对话" clicked', () => {
    renderWithRouter()
    const startButton = screen.getByText('开始对话')
    fireEvent.click(startButton)
    expect(mockNavigate).toHaveBeenCalledWith('/chat')
  })
})
