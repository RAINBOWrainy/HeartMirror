/**
 * Chat Page
 * AI对话页面 - 使用 Tailwind + shadcn/ui
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wifi, WifiOff, Heart } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { Message } from '@/types'
import { chatApi } from '@/services/api'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { MessageList, ChatInput } from '@/components/Chat'
import { useCrisisAlert } from '@/components/common/CrisisAlert'
import { DailyEncouragement, recordSession } from '@/components/companion'
import { Badge, Alert } from '@/components/ui'
import { cn } from '@/lib/utils'

const Chat: React.FC = () => {
  const { currentSession, addMessage, isLoading, setLoading } = useChatStore()
  const { showAlert: showCrisisAlert } = useCrisisAlert()
  const { isOnline } = useOnlineStatus()
  const navigate = useNavigate()
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [sessionStarted, setSessionStarted] = useState(false)

  // 记录会话开始
  useEffect(() => {
    if (!sessionStarted) {
      recordSession()
      setSessionStarted(true)
    }
  }, [sessionStarted])

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
        content: userMessage,
      })

      // 更新会话ID
      if (response.data.sessionId && !currentSessionId) {
        setCurrentSessionId(response.data.sessionId)
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.content,
        emotion: response.data.emotion,
        emotionIntensity: response.data.emotionIntensity,
        timestamp: new Date(),
      }
      addMessage(aiMsg)

      // 高风险情绪提示
      if (response.data.emotionIntensity && response.data.emotionIntensity > 0.7) {
        showCrisisAlert({ emotionIntensity: response.data.emotionIntensity })
      }
    } catch (error: any) {
      console.error('发送消息失败:', error)
      // TODO: 使用新的 toast 系统
      alert(error.response?.data?.detail || '发送消息失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 连接状态指示器
  const ConnectionStatus = () => {
    if (!isOnline) {
      return (
        <Badge variant="error" className="flex items-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5" />
          离线
        </Badge>
      )
    }

    return (
      <Badge variant="success" className="flex items-center gap-1.5">
        <Wifi className="w-3.5 h-3.5" />
        已连接
      </Badge>
    )
  }

  return (
    <div className="h-[calc(100vh-56px-48px)] flex flex-col">
      {/* 顶部区域 */}
      <div className="mb-4 space-y-3">
        {/* 温馨提示 */}
        <Alert variant="info" className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary shrink-0" />
          <span>温馨提示：这是AI辅助对话，不构成医疗诊断或治疗建议</span>
        </Alert>

        {/* 连接状态和每日鼓励 */}
        <div className="flex items-center justify-between">
          <ConnectionStatus />
          <DailyEncouragement compact />
        </div>
      </div>

      {/* 消息列表 */}
      <div
        className={cn(
          'flex-1 overflow-hidden mb-4 rounded-lg',
          'bg-surface border border-border shadow-card',
          'px-4'
        )}
      >
        <MessageList
          messages={currentSession?.messages || []}
          isLoading={isLoading}
          loadingText="AI正在思考..."
        />
      </div>

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