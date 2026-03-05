import { useEffect, useState, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, Spin, Result, Button, Alert } from 'antd'
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

// 演示模式 - 生成模拟用户
function createDemoUser() {
  const adjectives = ['快乐', '温暖', '阳光', '星空', '晨曦', '清风']
  const nouns = ['小鹿', '飞鸟', '流星', '微风', '云朵', '蝴蝶']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 1000)

  return {
    id: `demo-${Date.now()}`,
    anonymous_id: `${adj}${noun}${num}`,
    risk_level: 'green',
    created_at: new Date().toISOString(),
    is_guest: true,
    guest_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
}

// 检测是否为静态部署环境（GitHub Pages）
const isStaticDeployment = window.location.hostname.includes('github.io') ||
                           window.location.hostname.includes('vercel.app') ||
                           import.meta.env.VITE_DEMO_MODE === 'true'

function App() {
  const { isAuthenticated, guestLogin, _hasHydrated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // 等待 zustand persist hydration 完成
  useEffect(() => {
    if (!_hasHydrated) return

    const initApp = async () => {
      // 如果已经认证，直接进入
      if (isAuthenticated) {
        setLoading(false)
        return
      }

      // 静态部署环境：直接启用演示模式
      if (isStaticDeployment) {
        console.log('[Demo Mode] Static deployment detected, enabling demo mode')
        const demoUser = createDemoUser()
        const demoToken = `demo-token-${Date.now()}`
        guestLogin(demoToken, demoUser)
        setIsDemoMode(true)
        setLoading(false)
        return
      }

      // 本地开发环境：尝试连接后端
      try {
        const response = await authApi.guestLogin()
        const { access_token, user } = response.data
        guestLogin(access_token, user)
        console.log('[Auto Login] Guest session created')
      } catch (err) {
        console.error('[Auto Login] Failed:', err)
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

  // 本地开发环境且未认证时显示错误
  if (!isAuthenticated && !isStaticDeployment) {
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
          subTitle="请确保后端服务正在运行（cd backend && python -m uvicorn app.main:app --reload）"
          extra={[
            <Button type="primary" key="retry" onClick={() => window.location.reload()}>
              重试
            </Button>,
            <Button key="demo" onClick={() => {
              const demoUser = createDemoUser()
              const demoToken = `demo-token-${Date.now()}`
              guestLogin(demoToken, demoUser)
              setIsDemoMode(true)
            }}>
              进入演示模式
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
        {/* 演示模式提示 */}
        {isDemoMode && (
          <Alert
            message="演示模式"
            description="当前为演示模式，数据仅保存在本地浏览器中。如需完整功能，请部署后端服务。"
            type="info"
            showIcon
            closable
            style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}
          />
        )}
        <BrowserRouter basename={basename}>
          <Routes>
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