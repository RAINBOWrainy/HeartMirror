import React from 'react'
import { Alert, Space, Typography } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

interface GuestModeBannerProps {
  guestExpiresAt?: string
}

const GuestModeBanner: React.FC<GuestModeBannerProps> = ({ guestExpiresAt }) => {
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
      type="info"
      showIcon
      icon={<InfoCircleOutlined />}
      message={
        <Space>
          <Text strong>欢迎使用心镜</Text>
          <Text type="secondary">会话有效期: {getRemainingTime()}</Text>
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