/**
 * Chat Page
 * AI对话页面 - 使用 HTTP API
 */

import React, { useState } from 'react'
import { Card, Alert, message, Tag, Space } from 'antd'
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons'
import { useChatStore } from '../stores/chatStore'
import { Message } from '../types'
import { chatApi } from '../services/api'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { MessageList, ChatInput } from '../components/Chat'
import { useCrisisAlert } from '../components/common/CrisisAlert'

const Chat: React.FC = () => {
  const { currentSession, addMessage, isLoading, setLoading } = useChatStore()
  const { showAlert: showCrisisAlert } = useCrisisAlert()
  const { isOnline } = useOnlineStatus()
  const [currentSessionId, setCurrentSessionId] = useState<string>('')

  // 发送消息
  const handleSend = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }
    addMessage(userMsg)
    setLoading(true)

    try {
      const response = await chatApi.sendMessage({
        session_id: currentSessionId || currentSession?.id,
        message: userMessage,
      })

      // 更新会话ID
      if (response.data.session_id && !currentSessionId) {
        setCurrentSessionId(response.data.session_id)
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.reply,
        emotion: response.data.emotion_detected,
        emotionIntensity: response.data.emotion_intensity,
        timestamp: new Date(),
      }
      addMessage(aiMsg)

      // 高风险情绪提示
      if (response.data.emotion_intensity && response.data.emotion_intensity > 0.7) {
        showCrisisAlert({ emotionIntensity: response.data.emotion_intensity })
      }
    } catch (error: any) {
      console.error('发送消息失败:', error)
      message.error(error.response?.data?.detail || '发送消息失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 连接状态指示器
  const ConnectionStatus = () => {
    if (!isOnline) {
      return (
        <Tag color="error" icon={<DisconnectOutlined />}>
          离线
        </Tag>
      )
    }

    return (
      <Tag color="success" icon={<WifiOutlined />}>
        已连接
      </Tag>
    )
  }

  return (
    <div style={{
      height: 'calc(100vh - 64px - 48px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 免责声明和连接状态 */}
      <Space direction="vertical" style={{ marginBottom: 16, width: '100%' }}>
        <Alert
          message="请注意：这是AI辅助对话，不构成医疗诊断或治疗建议"
          type="info"
          showIcon
          style={{ borderRadius: 8 }}
        />
        <ConnectionStatus />
      </Space>

      {/* 消息列表 */}
      <Card
        style={{
          flex: 1,
          overflow: 'hidden',
          marginBottom: 16,
          borderRadius: 12
        }}
        bodyStyle={{
          height: '100%',
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <MessageList
          messages={currentSession?.messages || []}
          isLoading={isLoading}
          loadingText="AI正在思考..."
        />
      </Card>

      {/* 输入区域 */}
      <ChatInput
        onSend={handleSend}
        loading={isLoading}
        disabled={!isOnline}
        placeholder={isOnline ? '输入您想说的话...' : '您当前离线，请检查网络连接'}
      />
    </div>
  )
}

export default Chat