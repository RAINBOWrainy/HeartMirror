import React, { useState, useRef, useEffect } from 'react'
import { Card, Input, Button, Space, Typography, Avatar, Spin, Empty, message, Modal, Alert } from 'antd'
import { SendOutlined, UserOutlined, RobotOutlined, AlertOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useChatStore, Message } from '../stores/chatStore'
import { chatApi } from '../services/api'

const { TextArea } = Input
const { Text, Paragraph } = Typography

const Chat: React.FC = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { currentSession, setCurrentSession, addMessage, isLoading, setLoading } = useChatStore()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 如果有 sessionId，加载会话
    if (sessionId) {
      loadSession(sessionId)
    }
  }, [sessionId])

  useEffect(() => {
    // 滚动到最新消息
    scrollToBottom()
  }, [currentSession?.messages])

  const loadSession = async (id: string) => {
    try {
      const response = await chatApi.getSession(id)
      // TODO: 处理加载的会话
    } catch (error) {
      message.error('加载会话失败')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')

    // 添加用户消息
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

      // 添加AI回复
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.reply,
        emotion: response.data.emotion_detected,
        emotionIntensity: response.data.emotion_intensity,
        timestamp: new Date(),
      }
      addMessage(aiMsg)

      // 如果检测到高风险情绪，显示提示
      if (response.data.emotion_intensity >= 0.8) {
        Modal.warning({
          title: '情绪关注',
          content: (
            <div>
              <Paragraph>我们检测到您可能正在经历强烈的情绪。</Paragraph>
              <Paragraph>如果您感到困扰，请随时查看我们的危机支持页面，或拨打心理援助热线。</Paragraph>
              <Button type="primary" onClick={() => navigate('/crisis')}>
                查看危机支持
              </Button>
            </div>
          ),
        })
      }
    } catch (error) {
      message.error('发送消息失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <Alert
        message="请注意：这是AI辅助对话，不构成医疗诊断或治疗建议"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 消息列表 */}
      <Card
        style={{
          flex: 1,
          overflow: 'auto',
          marginBottom: 16,
        }}
      >
        {currentSession?.messages.length === 0 ? (
          <Empty
            description="开始您的对话吧"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {currentSession?.messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Space
                  align="start"
                  style={{
                    maxWidth: '80%',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{
                      backgroundColor: msg.role === 'user' ? '#1890ff' : '#52c41a',
                    }}
                  />
                  <div>
                    <Card
                      size="small"
                      style={{
                        background: msg.role === 'user' ? '#e6f7ff' : '#f6ffed',
                        borderRadius: 12,
                      }}
                    >
                      <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Paragraph>
                      {msg.emotion && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          检测情绪: {msg.emotion}
                          {msg.emotionIntensity && ` (${(msg.emotionIntensity * 100).toFixed(0)}%)`}
                        </Text>
                      )}
                    </Card>
                  </div>
                </Space>
              </div>
            ))}
            {isLoading && (
              <div style={{ textAlign: 'center' }}>
                <Spin tip="AI正在思考..." />
              </div>
            )}
            <div ref={messagesEndRef} />
          </Space>
        )}
      </Card>

      {/* 输入区域 */}
      <Card>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您想说的话..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ borderRadius: '8px 0 0 8px' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isLoading}
            style={{ height: 'auto', borderRadius: '0 8px 8px 0' }}
          >
            发送
          </Button>
        </Space.Compact>
      </Card>
    </div>
  )
}

export default Chat