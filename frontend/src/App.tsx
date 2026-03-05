import { useEffect, useState, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, Spin, Result, Button } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import ErrorBoundary from './components/common/ErrorBoundary'
import MainLayout from './components/common/MainLayout'
import { useAuthStore } from './stores/authStore'
import { authApi } from './services/api'

// 路由懒加载 - 代码分割优化
const Home = lazy(() => import('./pages/Home'))
const Chat = lazy(() => import('./pages/Chat'))
const Diary = lazy(() => import('./pages/Diary'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Crisis = lazy(() => import('./pages/Crisis'))

// 加载组件
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    minHeight: '400px',
    background: '#f5f5f5'
  }}>
    <Spin size="large" tip="加载中..." />
  </div>
)

// 主题配置
const themeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    fontSize: 14,
  },
  components: {
    Card: { borderRadiusLG: 16 },
    Button: { borderRadius: 8 },
    Input: { borderRadius: 8 },
    Select: { borderRadius: 8 },
    Modal: { borderRadiusLG: 16 },
    Tag: { borderRadiusSM: 8 },
  }
}

// GitHub Pages basename配置
const basename = import.meta.env.BASE_URL || '/HeartMirror/'

function App() {
  const { isAuthenticated, guestLogin, _hasHydrated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 等待 zustand persist hydration 完成
  useEffect(() => {
    if (!_hasHydrated) return

    const initApp = async () => {
      // 如果已经认证，直接进入
      if (isAuthenticated) {
        setLoading(false)
        return
      }

      // 尝试连接后端创建游客会话
      try {
        const response = await authApi.guestLogin()
        const { access_token, user } = response.data
        guestLogin(access_token, user)
        console.log('[Auto Login] Guest session created')
      } catch (err: any) {
        console.error('[Auto Login] Failed:', err)
        setError(err.message || '无法连接到后端服务器')
      }
      setLoading(false)
    }

    initApp()
  }, [_hasHydrated, isAuthenticated, guestLogin])

  // Hydration 未完成或加载中
  if (!_hasHydrated || loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Spin size="large" tip="正在初始化..." />
      </div>
    )
  }

  // 未认证时显示错误
  if (!isAuthenticated || error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <Result
          status="error"
          title="无法连接到后端服务器"
          subTitle={error || '请确保后端服务正在运行'}
          extra={[
            <Button type="primary" key="retry" onClick={() => window.location.reload()}>
              重试
            </Button>
          ]}
        />
      </div>
    )
  }

  // 主应用
  return (
    <ErrorBoundary>
      <ConfigProvider theme={themeConfig} locale={zhCN}>
        <BrowserRouter basename={basename}>
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
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/crisis" element={<Crisis />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </MainLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App