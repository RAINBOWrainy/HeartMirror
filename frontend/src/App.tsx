import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import ErrorBoundary from './components/common/ErrorBoundary'
import MainLayout from './components/common/MainLayout'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Diary from './pages/Diary'
import Dashboard from './pages/Dashboard'
import Crisis from './pages/Crisis'
import Login from './pages/Login'
import Register from './pages/Register'
import { useAuthStore } from './stores/authStore'

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
  const { isAuthenticated } = useAuthStore()

  return (
    <ErrorBoundary>
      <ConfigProvider theme={themeConfig} locale={zhCN}>
        <BrowserRouter basename={basename}>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

            {/* 受保护路由 */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <MainLayout>
                    <Routes>
                      <Route index element={<Home />} />
                      <Route path="chat" element={<Chat />} />
                      <Route path="chat/:sessionId" element={<Chat />} />
                      <Route path="diary" element={<Diary />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="crisis" element={<Crisis />} />
                    </Routes>
                  </MainLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App