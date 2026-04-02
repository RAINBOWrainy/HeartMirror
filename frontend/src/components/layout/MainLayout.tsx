/**
 * Main Layout Component
 * Responsive layout with sidebar navigation
 * Replaces Ant Design Layout
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Heart, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Navigation items
const navItems = [
  { path: '/', label: '首页', icon: HomeIcon },
  { path: '/chat', label: '对话', icon: ChatIcon },
  { path: '/dashboard', label: '看板', icon: DashboardIcon },
  { path: '/diary', label: '日记', icon: DiaryIcon },
  { path: '/questionnaire', label: '评估', icon: AssessmentIcon },
  { path: '/intervention', label: '干预', icon: InterventionIcon },
  { path: '/profile', label: '我的', icon: ProfileIcon },
  { path: '/settings', label: '设置', icon: SettingsIcon },
]

// Simple icon components (using Lucide icons would be better)
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
    </svg>
  )
}

function DiaryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function AssessmentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
}

function InterventionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

// Sidebar component
interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-200 ease-out',
        'bg-surface border-r border-border shadow-sidebar',
        collapsed ? 'w-20' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white shadow-soft">
            <Heart className="w-5 h-5" />
          </div>
          {!collapsed && (
            <span className="font-heading text-lg font-semibold text-foreground">心镜</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                'hover:bg-muted',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => onCollapse(!collapsed)}
        className="absolute bottom-4 right-2 p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label={collapsed ? '展开菜单' : '收起菜单'}
      >
        <svg
          className={cn('w-5 h-5 transition-transform duration-200', collapsed && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
        </svg>
      </button>
    </aside>
  )
}

// Mobile drawer
interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const navigate = useNavigate()
  const location = useLocation()

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 z-50 h-full w-72 bg-surface shadow-elevated animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white">
              <Heart className="w-5 h-5" />
            </div>
            <span className="font-heading text-lg font-semibold text-foreground">心镜</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="关闭菜单"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  onClose()
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                  'hover:bg-muted',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}

// Header component
interface HeaderProps {
  sidebarCollapsed: boolean
  onMenuClick: () => void
  isMobile: boolean
}

function Header({ sidebarCollapsed, onMenuClick, isMobile }: HeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-14 bg-surface border-b border-border shadow-header transition-all duration-200 ease-out',
        'flex items-center justify-between px-4',
        !isMobile && (sidebarCollapsed ? 'left-20' : 'left-60')
      )}
    >
      {isMobile ? (
        <>
          {/* Mobile: Menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="打开菜单"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white">
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-heading text-base font-semibold text-foreground">心镜</span>
          </div>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1">
                <Avatar className="w-9 h-9">
                  <AvatarFallback>
                    {user?.nickname?.[0] || user?.anonymous_id?.[0] || '用'}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.nickname || user?.anonymous_id || '用户'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                个人中心
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                设置
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          {/* Desktop: Title */}
          <span className="text-sm text-muted-foreground">
            心理健康自助管理工具
          </span>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {user?.nickname?.[0] || user?.anonymous_id?.[0] || '用'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground">
                  {user?.nickname || user?.anonymous_id || '用户'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user?.nickname || user?.anonymous_id || '用户'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                个人中心
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                设置
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </header>
  )
}

// Main layout props
interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  // Handle responsive
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setMobileDrawerOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      {!isMobile && (
        <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      )}

      {/* Mobile drawer */}
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      {/* Header */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileDrawerOpen(true)}
        isMobile={isMobile}
      />

      {/* Main content */}
      <main
        className={cn(
          'min-h-screen pt-14 transition-all duration-200 ease-out',
          !isMobile && (sidebarCollapsed ? 'pl-20' : 'pl-60'),
          isMobile ? 'px-4' : 'px-6',
          'pb-6'
        )}
      >
        {children}
      </main>
    </div>
  )
}

export default MainLayout