import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import MainLayout from './components/common/MainLayout'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Diary from './pages/Diary'
import Dashboard from './pages/Dashboard'
import Crisis from './pages/Crisis'
import Login from './pages/Login'
import Register from './pages/Register'
import { useAuthStore } from './stores/authStore'

const { Content } = Layout

// GitHub Pages basename配置
const basename = import.meta.env.BASE_URL || '/HeartMirror/'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter basename={basename}>
      <Layout style={{ minHeight: '100vh' }}>
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
                  <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
                    <Routes>
                      <Route index element={<Home />} />
                      <Route path="chat" element={<Chat />} />
                      <Route path="chat/:sessionId" element={<Chat />} />
                      <Route path="diary" element={<Diary />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="crisis" element={<Crisis />} />
                    </Routes>
                  </Content>
                </MainLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App