/**
 * Chat Page
 * AI对话页面 - 完整版本（WebSocket + 离线支持）
 */

import React, { useEffect, useState, useCallback } from 'react'
import { Card, Alert, message, Tag, Space, Badge, Button } from 'antd'
import { useParams } from 'react-router-dom'
import { WifiOutlined, DisconnectOutlined, ReloadOutlined, CloudSyncOutlined } from '@ant-design/icons'
import { useChatStore } from '../stores/chatStore'
import { Message } from '../types'
import { chatApi } from '../services/api'
import { useWebSocket, WebSocketStatus } from '../hooks/useWebSocket'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useMessageQueue } from '../hooks/useMessageQueue'
import { MessageList, ChatInput } from '../components/Chat'
import { useCrisisAlert } from '../components/common/CrisisAlert'

const Chat: React.FC = () => {
  const { sessionId } = useParams()
  const { currentSession, addMessage, isLoading, setLoading } = useChatStore()
  const { showAlert: showCrisisAlert } = useCrisisAlert()
  const [useWebSocketMode, setUseWebSocketMode] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState<string>('')

  // 离线检测
  const { isOnline } = useOnlineStatus()

  // 消息队列（离线时缓存）
  const {
    queue: pendingMessages,
    enqueue,
    dequeue,
    remove,
    size: queueSize,
    isEmpty: isQueueEmpty
  } = useMessageQueue()

  // 初始化会话ID
  useEffect(() => {
    if (sessionId) {
      setCurrentSessionId(sessionId)
      loadSession(sessionId)
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setCurrentSessionId(newSessionId)
    }
  }, [sessionId])

  // WebSocket 消息处理
  const handleWebSocketMessage = useCallback((data: any) => {
    setLoading(false)

    if (data.type === 'message') {
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        emotion: data.emotion_detected,
        emotionIntensity: data.emotion_intensity,
        timestamp: new Date(),
      }
      addMessage(aiMsg)

      // 高风险情绪提示
      showCrisisAlert({ riskLevel: data.risk_level })
    }
  }, [addMessage, setLoading, showCrisisAlert])

  // WebSocket 连接
  const {
    status: wsStatus,
    send: wsSend,
    reconnect: wsReconnect
  } = useWebSocket({
    sessionId: currentSessionId,
    onMessage: handleWebSocketMessage,
    onTyping: () => setLoading(true),
    onError: (error) => {
      message.error(error)
      setUseWebSocketMode(false)
    },
    onConnect: () => {
      setUseWebSocketMode(true)
      // 连接恢复后，发送队列中的消息
      processPendingMessages()
    }
  })

  // 处理队列中的待发送消息
  const processPendingMessages = useCallback(() => {
    if (!isOnline || wsStatus !== 'connected') return

    const processNext = () => {
      const pendingMsg = dequeue()
      if (pendingMsg) {
        wsSend(pendingMsg.content)
        remove(pendingMsg.id)
        // 继续处理下一条
        setTimeout(processNext, 100)
      }
    }

    processNext()
  }, [isOnline, wsStatus, dequeue, wsSend, remove])

  // 加载会话历史
  const loadSession = async (id: string) => {
    try {
      const response = await chatApi.getSession(id)
      const sessionData = response.data

      // 将消息加载到当前会话
      if (sessionData.messages && sessionData.messages.length > 0) {
        const messages: Message[] = sessionData.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          emotion: msg.emotion_detected,
          emotionIntensity: msg.emotion_intensity,
          timestamp: new Date(msg.created_at),
        }))

        // 更新会话到 store
        const session = {
          id: sessionData.id,
          title: sessionData.title,
          messages,
          currentStage: sessionData.current_stage,
          createdAt: new Date(sessionData.started_at),
          lastMessageAt: sessionData.last_message_at ? new Date(sessionData.last_message_at) : undefined,
        }

        useChatStore.getState().setCurrentSession(session)
      }
    } catch (error) {
      console.error('加载会话失败', error)
    }
  }

  // 发送消息 - WebSocket 模式
  const handleSendWebSocket = (userMessage: string) => {
    if (!userMessage.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }
    addMessage(userMsg)
    setLoading(true)
    wsSend(userMessage)
  }

  // 发送消息 - HTTP 降级模式
  const handleSendHTTP = async (userMessage: string) => {
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
        session_id: currentSession?.id || sessionId,
        message: userMessage,
      })

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
      showCrisisAlert({ emotionIntensity: response.data.emotion_intensity })
    } catch (error) {
      message.error('发送消息失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 统一发送处理
  const handleSend = (userMessage: string) => {
    if (!isOnline) {
      // 离线时加入队列
      enqueue(userMessage)
      message.info('您当前离线，消息将在连接恢复后发送')
      return
    }

    if (useWebSocketMode && wsStatus === 'connected') {
      handleSendWebSocket(userMessage)
    } else {
      handleSendHTTP(userMessage)
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

    const statusConfig: Record<WebSocketStatus, { color: string; icon: React.ReactNode; text: string }> = {
      connecting: { color: 'processing', icon: <ReloadOutlined spin />, text: '连接中' },
      connected: { color: 'success', icon: <WifiOutlined />, text: '已连接' },
      disconnected: { color: 'default', icon: <DisconnectOutlined />, text: '未连接' },
      error: { color: 'error', icon: <DisconnectOutlined />, text: '连接错误' }
    }

    const config = statusConfig[wsStatus]

    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
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
        <Space>
          <ConnectionStatus />
          {wsStatus === 'error' && isOnline && (
            <Button size="small" onClick={wsReconnect}>
              重新连接
            </Button>
          )}
          {!isQueueEmpty && (
            <Badge count={queueSize} size="small">
              <Tag color="warning" icon={<CloudSyncOutlined />}>
                待发送
              </Tag>
            </Badge>
          )}
        </Space>
      </Space>

      {/* 消息列表 */}
      <Card
        style={{
          flex: 1,
          overflow: 'hidden',
          marginBottom: 0,
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
        placeholder={isOnline ? '输入您想说的话...' : '您当前离线，消息将在连接恢复后发送'}
      />
    </div>
  )
}

export default Chat