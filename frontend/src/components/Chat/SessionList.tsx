/**
 * SessionList Component
 * 会话列表组件 - 显示历史对话会话
 */

import React from 'react'
import { List, Card, Button, Space, Typography, Tag, Empty, Spin, Popconfirm } from 'antd'
import { MessageOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { ChatSession } from '../../stores/chatStore'

const { Text } = Typography

interface SessionListProps {
  sessions: ChatSession[]
  currentSessionId?: string
  loading?: boolean
  onSelect: (session: ChatSession) => void
  onDelete: (sessionId: string) => void
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentSessionId,
  loading = false,
  onSelect,
  onDelete
}) => {
  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  const getStageTag = (stage: string) => {
    const stageConfig: Record<string, { color: string; text: string }> = {
      greeting: { color: 'blue', text: '问候' },
      emotion_assessment: { color: 'orange', text: '情绪评估' },
      questionnaire: { color: 'purple', text: '问卷' },
      risk_assessment: { color: 'red', text: '风险评估' },
      intervention: { color: 'green', text: '干预' },
      closing: { color: 'default', text: '结束' }
    }
    const config = stageConfig[stage] || { color: 'default', text: stage }
    return <Tag color={config.color} style={{ borderRadius: 8 }}>{config.text}</Tag>
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <Empty
        description="暂无对话记录"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  return (
    <List
      dataSource={sessions}
      renderItem={(session) => {
        const isActive = session.id === currentSessionId
        const messageCount = session.messages?.length || 0

        return (
          <List.Item style={{ padding: '8px 0' }}>
            <Card
              hoverable
              size="small"
              onClick={() => onSelect(session)}
              style={{
                width: '100%',
                borderRadius: 12,
                border: isActive ? '2px solid #1890ff' : '1px solid #f0f0f0',
                background: isActive ? '#e6f7ff' : '#fff'
              }}
              bodyStyle={{ padding: 12 }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <MessageOutlined style={{ color: '#1890ff' }} />
                    <Text strong style={{ fontSize: 14 }}>
                      {session.title || '新对话'}
                    </Text>
                  </Space>
                  <Popconfirm
                    title="确定删除此对话？"
                    onConfirm={(e) => {
                      e?.stopPropagation()
                      onDelete(session.id)
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>

                <Space size={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {messageCount} 条消息
                  </Text>
                  {getStageTag(session.currentStage)}
                </Space>

                <Space>
                  <ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDate(session.lastMessageAt || session.createdAt)}
                  </Text>
                </Space>
              </Space>
            </Card>
          </List.Item>
        )
      }}
    />
  )
}

export default SessionList