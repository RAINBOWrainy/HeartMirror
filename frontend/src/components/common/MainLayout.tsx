/**
 * MainLayout Component
 * 主布局组件 - 使用 Tailwind + shadcn/ui
 */

import React, { useState, useEffect } from 'react'
import {
  Home,
  MessageSquare,
  Book,
  LayoutDashboard,
  User,
  Menu,
  X,
  Heart,
  Settings,
  ClipboardCheck,
  Activity,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button, Avatar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  // 判断是否为移动端
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 监听屏幕变化
  useEffect(() => {
    if (!isMobile) {
      setDrawerVisible(false)
    }
  }, [isMobile])

  // 完整导航菜单 (8项)
  const menuItems = [
    { key: '/', icon: Home, label: '首页' },
    { key: '/chat', icon: MessageSquare, label: '对话' },
    { key: '/dashboard', icon: LayoutDashboard, label: '看板' },
    { key: '/diary', icon: Book, label: '日记' },
    { key: '/questionnaire', icon: ClipboardCheck, label: '评估' },
    { key: '/intervention', icon: Activity, label: '干预' },
    { key: '/profile', icon: User, label: '我的' },
    { key: '/settings', icon: Settings, label: '设置' },
  ]

  const handleMenuClick = (key: string) => {
    navigate(key)
    if (isMobile) {
      setDrawerVisible(false)
    }
  }

  // Logo 组件
  const Logo = ({ collapsed: isCollapsed }: { collapsed: boolean }) => (
    <div className="h-16 flex items-center justify-center">
      <div
        className="w-10 h-10 rounded-3 flex items-center justify-center text-white shadow-soft"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)'
        }}
      >
        <Heart className="w-5 h-5" />
      </div>
      {!isCollapsed && (
        <span className="font-heading text-lg font-semibold text-foreground ml-3">心镜</span>
      )}
    </div>
  )

  // 菜单内容
  const menuContent = (
    <div className="py-2">
      <Logo collapsed={collapsed && !isMobile} />
      <nav className="mt-2 px-3 space-y-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon
          const isActive = location.pathname === item.key
          return (
            <button
              key={item.key}
              onClick={() => handleMenuClick(item.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 min-h-11 rounded-lg transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <IconComponent className="w-5 h-5" />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </div>
  )

  // 移动端抽屉菜单
  if (isMobile) {
    return (
      <div className="min-h-screen bg-base">
        {/* 移动端顶部导航 */}
        <header className="sticky top-0 z-50 h-14 px-4 flex justify-between items-center bg-surface border-b border-border shadow-header">
          <button
            onClick={() => setDrawerVisible(true)}
            className="w-11 h-11 rounded-md flex items-center justify-center bg-muted"
          >
            <Menu className="w-5 h-5 text-primary" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-2.5 flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)'
              }}
            >
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-semibold text-foreground">心镜</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer bg-primary text-white" size="sm">
                <User className="w-4 h-4" />
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                个人中心
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                API 设置
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* 移动端抽屉 */}
        {drawerVisible && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setDrawerVisible(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-70 bg-surface z-50 shadow-elevated">
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setDrawerVisible(false)}
                  className="w-11 h-11 rounded-md flex items-center justify-center bg-muted"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              {menuContent}
            </div>
          </>
        )}

        {/* 内容区域 */}
        <main className="p-4 min-h-[calc(100vh-56px)] bg-base">
          {children}
        </main>
      </div>
    )
  }

  // 桌面端布局
  return (
    <div className="min-h-screen bg-base">
      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 bg-surface border-r border-border shadow-sidebar transition-all duration-200 overflow-auto',
          collapsed ? 'w-20' : 'w-60'
        )}
      >
        {menuContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-4 h-4" />
        </button>
      </aside>

      {/* 主内容区 */}
      <div
        className={cn(
          'transition-all duration-200',
          collapsed ? 'ml-20' : 'ml-60'
        )}
      >
        {/* 顶部导航 */}
        <header className="sticky top-0 z-40 h-14 px-6 flex justify-between items-center bg-surface border-b border-border shadow-header">
          <span className="text-sm text-muted-foreground">心理健康自助管理工具</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 cursor-pointer">
                <Avatar className="bg-primary text-white" size="sm">
                  <User className="w-4 h-4" />
                </Avatar>
                <span className="text-foreground">{user?.nickname || user?.anonymous_id || '用户'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                个人中心
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                API 设置
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* 内容 */}
        <main className="p-6 min-h-[calc(100vh-56px)]">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout