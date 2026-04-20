/**
 * MainLayout Component Tests
 * 主布局组件测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MainLayout } from './MainLayout'

// Mock useAuthStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { nickname: '测试用户' }
  })
}))

const renderWithRouter = (children: React.ReactNode) => {
  return render(
    <MemoryRouter>
      {children}
    </MemoryRouter>
  )
}

describe('MainLayout', () => {
  beforeEach(() => {
    // Reset window width to desktop
    window.innerWidth = 1024
  })

  it('should render sidebar on desktop', () => {
    renderWithRouter(<MainLayout>Test Content</MainLayout>)
    expect(screen.getByText('心镜')).toBeInTheDocument()
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.getByText('对话')).toBeInTheDocument()
    expect(screen.getByText('日记')).toBeInTheDocument()
    expect(screen.getByText('设置')).toBeInTheDocument()
  })

  it('should render main content', () => {
    renderWithRouter(<MainLayout>Test Content</MainLayout>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should toggle sidebar collapse when clicking collapse button', () => {
    renderWithRouter(<MainLayout>Test Content</MainLayout>)
    const collapseButton = screen.getByLabelText(/收起菜单|展开菜单/)
    expect(screen.getByText('首页')).toBeInTheDocument() // Full text visible

    fireEvent.click(collapseButton)
    // After collapse, text shouldn't be visible in collapsed sidebar
    expect(screen.queryByText('首页')).not.toBeVisible()
  })

  it('should show user name in header', () => {
    renderWithRouter(<MainLayout>Test Content</MainLayout>)
    expect(screen.getByText('测试用户')).toBeInTheDocument()
  })

  it('should open mobile drawer when menu button clicked on mobile', () => {
    // Simulate mobile width
    window.innerWidth = 375
    renderWithRouter(<MainLayout>Test Content</MainLayout>)

    const menuButton = screen.getByLabelText('打开菜单')
    fireEvent.click(menuButton)

    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.getByText('对话')).toBeInTheDocument()
  })

  it('should close mobile drawer when navigation item clicked', () => {
    window.innerWidth = 375
    renderWithRouter(<MainLayout>Test Content</MainLayout>)

    const menuButton = screen.getByLabelText('打开菜单')
    fireEvent.click(menuButton)

    const navItem = screen.getByText('对话')
    fireEvent.click(navItem)

    // Drawer should close after navigation
    expect(screen.queryByText('关闭菜单')).not.toBeInTheDocument()
  })

  it('should render all navigation items', () => {
    renderWithRouter(<MainLayout>Test Content</MainLayout>)
    const items = [
      '首页', '对话', '看板', '日记',
      '评估', '干预', '我的', '设置'
    ]
    items.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })
})
