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
    minHeight: '400px'
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
  const { isAuthenticated, guestLogin } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 自动游客登录 - 直接进入主界面
  useEffect(() => {
    const autoLogin = async () => {
      if (!isAuthenticated) {
        try {
          const response = await authApi.guestLogin()
          const { access_token, user } = response.data
          guestLogin(access_token, user)
          console.log('[Auto Login] Guest session created')
        } catch (err) {
          console.error('[Auto Login] Failed:', err)
          setError('无法连接到服务器，请检查网络连接后刷新页面重试')
        }
      }
      setLoading(false)
    }

    autoLogin()
  }, [isAuthenticated, guestLogin])

  // 重试登录
  const handleRetry = () => {
    setError(null)
    setLoading(true)
    window.location.reload()
  }

  // 加载中状态
  if (loading) {
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

  // 错误状态
  if (error) {
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
          title="初始化失败"
          subTitle={error}
          extra={[
            <Button type="primary" key="retry" onClick={handleRetry}>
              重试
            </Button>
          ]}
        />
      </div>
    )
  }

  // 主应用 - 直接进入
  return (
    <ErrorBoundary>
      <ConfigProvider theme={themeConfig} locale={zhCN}>
        <BrowserRouter basename={basename}>
          <Routes>
            {/* 主应用路由 - 无需登录 */}
            <Route
              path="/"
              element={
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route index element={<Home />} />
                      <Route path="chat" element={<Chat />} />
                      <Route path="chat/:sessionId" element={<Chat />} />
                      <Route path="diary" element={<Diary />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="crisis" element={<Crisis />} />
                    </Routes>
                  </Suspense>
                </MainLayout>
              }
            />
            {/* 其他所有路径重定向到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App