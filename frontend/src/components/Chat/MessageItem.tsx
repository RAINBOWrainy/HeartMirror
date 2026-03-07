/**
 * MessageItem Component
 * 单条消息显示组件 - 温暖友好风格
 */

import React from 'react'
import { Card, Avatar, Space, Typography, Tooltip } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import type { Message } from '../../stores/chatStore'
import EmotionBadge from './EmotionBadge'
import { brandColors } from '../../theme'

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
        marginBottom: 16,
        animation: 'slideUpFade 0.3s ease-out',
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
              backgroundColor: isUser ? brandColors.primary : brandColors.success,
              flexShrink: 0,
              boxShadow: `0 4px 12px ${isUser ? brandColors.primary : brandColors.success}30`,
            }}
          />
        </Tooltip>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Card
            size="small"
            style={{
              background: isUser
                ? `linear-gradient(135deg, ${brandColors.primary}10 0%, ${brandColors.primaryLight}08 100%)`
                : `linear-gradient(135deg, ${brandColors.success}10 0%, #f6ffed 100%)`,
              borderRadius: 16,
              border: isUser
                ? `1px solid ${brandColors.primary}15`
                : `1px solid ${brandColors.success}15`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <Paragraph
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#333',
                lineHeight: 1.6,
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