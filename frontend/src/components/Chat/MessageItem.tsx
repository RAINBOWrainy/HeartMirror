/**
 * MessageItem Component
 * 单条消息显示组件
 */

import React from 'react'
import { Card, Avatar, Space, Typography, Tooltip } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import type { Message } from '../../stores/chatStore'
import EmotionBadge from './EmotionBadge'

const { Paragraph, Text } = Typography

interface MessageItemProps {
  message: Message
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user'

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16
      }}
    >
      <Space
        align="start"
        style={{
          maxWidth: '80%',
          flexDirection: isUser ? 'row-reverse' : 'row'
        }}
      >
        <Tooltip title={isUser ? '我' : 'AI助手'}>
          <Avatar
            icon={isUser ? <UserOutlined /> : <RobotOutlined />}
            style={{
              backgroundColor: isUser ? '#1890ff' : '#52c41a',
              flexShrink: 0
            }}
          />
        </Tooltip>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Card
            size="small"
            style={{
              background: isUser ? '#e6f7ff' : '#f6ffed',
              borderRadius: 12,
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Paragraph
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {message.content}
            </Paragraph>
          </Card>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexDirection: isUser ? 'row-reverse' : 'row'
          }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatTime(message.timestamp)}
            </Text>
            {message.emotion && (
              <EmotionBadge
                emotion={message.emotion}
                intensity={message.emotionIntensity}
                showLabel
              />
            )}
          </div>
        </div>
      </Space>
    </div>
  )
}

export default MessageItem