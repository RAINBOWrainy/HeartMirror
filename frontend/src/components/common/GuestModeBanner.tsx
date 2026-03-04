import React from 'react'
import { Alert, Button, Space, Typography } from 'antd'
import { WarningOutlined, UserAddOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const { Text } = Typography

interface GuestModeBannerProps {
  guestExpiresAt?: string
  onRegister?: () => void
}

const GuestModeBanner: React.FC<GuestModeBannerProps> = ({ guestExpiresAt, onRegister }) => {
  // 计算剩余时间
  const getRemainingTime = () => {
    if (!guestExpiresAt) return '24小时'

    const expires = new Date(guestExpiresAt)
    const now = new Date()
    const diffMs = expires.getTime() - now.getTime()

    if (diffMs <= 0) return '已过期'

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  return (
    <Alert
      type="warning"
      showIcon
      icon={<WarningOutlined />}
      message={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Text strong>游客模式</Text>
            <Text type="secondary">剩余时间: {getRemainingTime()}</Text>
          </Space>
          <Space>
            <Link to="/register">
              <Button
                type="link"
                size="small"
                icon={<UserAddOutlined />}
                style={{ color: '#faad14', padding: 0 }}
              >
                注册账号保存数据
              </Button>
            </Link>
          </Space>
        </Space>
      }
      style={{
        marginBottom: 16,
        borderRadius: 8,
      }}
    />
  )
}

export default GuestModeBanner