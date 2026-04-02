import { useEffect, Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import { Loading } from '@/components/ui'
import { ThemeProvider } from '@/theme'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useAuthStore } from '@/stores/authStore'

// 路由懒加载 - 代码分割优化
const Home = lazy(() => import('@/pages/Home'))
const Chat = lazy(() => import('@/pages/Chat'))
const Diary = lazy(() => import('@/pages/Diary'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Crisis = lazy(() => import('@/pages/Crisis'))
const Intervention = lazy(() => import('@/pages/Intervention'))
const Questionnaire = lazy(() => import('@/pages/Questionnaire'))
const Settings = lazy(() => import('@/pages/Settings'))
const Profile = lazy(() => import('@/pages/Profile'))

// 加载组件
const PageLoader = () => <Loading tip="加载中..." />

// 纯本地应用默认用户
const DEFAULT_USER = {
  id: 'local-user',
  anonymous_id: '本地用户',
  nickname: '心镜用户',
  risk_level: 'GREEN' as const,
  is_guest: false,
}

function App() {
  const { isAuthenticated, setLocalMode, _hasHydrated } = useAuthStore()

  // 纯本地模式：自动设置默认用户
  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      setLocalMode(DEFAULT_USER)
      console.log('[HeartMirror] 纯本地模式已启动，数据加密存储在本地')
    }
  }, [_hasHydrated, isAuthenticated, setLocalMode])

  // 等待 hydration 完成
  if (!_hasHydrated) {
    return <Loading tip="加载中..." fullScreen />
  }

  // 纯本地应用 - 无需后端服务器
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <HashRouter>
          <Routes>
            <Route
              path="/*"
              element={
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/chat/:sessionId" element={<Chat />} />
                      <Route path="/diary" element={<Diary />} />
                      <Route path="/questionnaire" element={<Questionnaire />} />
                      <Route path="/intervention" element={<Intervention />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/crisis" element={<Crisis />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </MainLayout>
              }
            />
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App