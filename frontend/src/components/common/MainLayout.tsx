/**
 * MainLayout Component
 * 主布局组件 - 响应式重构版本
 */

import React, { useState, useEffect } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Drawer, Grid } from 'antd'
import {
  HomeOutlined,
  MessageOutlined,
  BookOutlined,
  DashboardOutlined,
  AlertOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined,
  HeartOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import GuestModeBanner from './GuestModeBanner'

const { Header, Sider, Content } = Layout
const { Text } = Typography
const { useBreakpoint } = Grid

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isGuest } = useAuthStore()
  const screens = useBreakpoint()

  // 判断是否为移动端
  const isMobile = !screens.md

  // 监听屏幕变化
  useEffect(() => {
    if (!isMobile) {
      setDrawerVisible(false)
    }
  }, [isMobile])

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: '对话',
    },
    {
      key: '/diary',
      icon: <BookOutlined />,
      label: '情绪日记',
    },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: '/crisis',
      icon: <AlertOutlined />,
      label: '危机支持',
    },
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  const handleMenuClick = (key: string) => {
    navigate(key)
    if (isMobile) {
      setDrawerVisible(false)
    }
  }

  const handleUserMenuClick = (key: string) => {
    if (key === 'logout') {
      // 重新加载页面，创建新的游客会话
      window.location.reload()
    }
  }

  // 菜单内容
  const menuContent = (
    <>
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'center',
          borderBottom: '1px solid #f0f0f0',
          padding: collapsed && !isMobile ? 0 : '0 24px',
        }}
      >
        <HeartOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: collapsed && !isMobile ? 0 : 8 }} />
        {(!collapsed || isMobile) && (
          <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
            心镜
          </Text>
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
        style={{ borderRight: 0 }}
      />
    </>
  )

  // 移动端抽屉菜单
  if (isMobile) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        {/* 移动端顶部导航 */}
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: 56
          }}
        >
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
          />
          <Space>
            <HeartOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Text strong style={{ color: '#1890ff' }}>心镜</Text>
          </Space>
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => handleUserMenuClick(key),
            }}
          >
            <Avatar
              icon={<UserOutlined />}
              style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
              size="small"
            />
          </Dropdown>
        </Header>

        {/* 移动端抽屉 */}
        <Drawer
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={280}
          closable={false}
          styles={{
            body: { padding: 0 }
          }}
          title={
            <Space>
              <HeartOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <Text strong style={{ fontSize: 18 }}>心镜</Text>
            </Space>
          }
          extra={
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setDrawerVisible(false)}
            />
          }
        >
          {menuContent}
        </Drawer>

        {/* 内容区域 */}
        <Content
          style={{
            padding: '16px',
            minHeight: 'calc(100vh - 56px)',
            background: '#f5f5f5'
          }}
        >
          {isGuest && <GuestModeBanner guestExpiresAt={user?.guest_expires_at} />}
          {children}
        </Content>
      </Layout>
    )
  }

  // 桌面端布局
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)'
        }}
        width={220}
      >
        {menuContent}
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 220,
          transition: 'margin-left 0.2s ease',
          background: '#f5f5f5'
        }}
      >
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 56
          }}
        >
          <Text type="secondary" style={{ fontSize: 14 }}>
            心理健康自助管理工具
          </Text>
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({ key }) => handleUserMenuClick(key),
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: isGuest ? '#faad14' : '#1890ff' }}
              />
              <Text>
                {user?.anonymous_id || '用户'}
                {isGuest && <Text type="warning" style={{ marginLeft: 4, fontSize: 12 }}>(游客)</Text>}
              </Text>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            padding: '24px',
            minHeight: 'calc(100vh - 56px)'
          }}
        >
          {isGuest && <GuestModeBanner guestExpiresAt={user?.guest_expires_at} />}
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout