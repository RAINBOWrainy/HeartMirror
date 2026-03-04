/**
 * EmptyState Component
 * 通用空状态组件
 */

import React from 'react'
import { Empty, Button, Typography, Space } from 'antd'
import {
  MessageOutlined,
  BookOutlined,
  DashboardOutlined,
  AlertOutlined,
  SearchOutlined
} from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface EmptyStateProps {
  type?: 'chat' | 'diary' | 'dashboard' | 'crisis' | 'search' | 'default'
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
}

const emptyConfigs = {
  chat: {
    icon: <MessageOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
    title: '开始对话',
    description: '与 AI 助手开始一段温暖的对话'
  },
  diary: {
    icon: <BookOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
    title: '记录心情',
    description: '写下今天的心情，让情绪被看见'
  },
  dashboard: {
    icon: <DashboardOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
    title: '数据看板',
    description: '开始使用后，这里将展示您的情绪数据'
  },
  crisis: {
    icon: <AlertOutlined style={{ fontSize: 48, color: '#faad14' }} />,
    title: '危机支持',
    description: '这里提供心理援助资源和应对策略'
  },
  search: {
    icon: <SearchOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />,
    title: '未找到结果',
    description: '请尝试其他关键词'
  },
  default: {
    icon: undefined,
    title: '暂无数据',
    description: '这里还没有任何内容'
  }
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'default',
  title,
  description,
  actionText,
  onAction
}) => {
  const config = emptyConfigs[type]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      minHeight: 300
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: type === 'chat' ? '#e6f7ff'
          : type === 'diary' ? '#f6ffed'
          : type === 'dashboard' ? '#f9f0ff'
          : type === 'crisis' ? '#fffbe6'
          : '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        {config.icon}
      </div>

      <Text strong style={{ fontSize: 16, marginBottom: 8 }}>
        {title || config.title}
      </Text>

      <Paragraph
        type="secondary"
        style={{ textAlign: 'center', marginBottom: 16, maxWidth: 280 }}
      >
        {description || config.description}
      </Paragraph>

      {actionText && onAction && (
        <Button type="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}

export default EmptyState