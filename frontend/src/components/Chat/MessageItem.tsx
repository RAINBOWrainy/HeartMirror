/**
 * MessageItem Component
 * 单条消息显示组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import { User, Bot } from 'lucide-react'
import type { Message } from '@/stores/chatStore'
import EmotionBadge from './EmotionBadge'
import { Avatar, AvatarFallback } from '@/components/ui'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

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
      className={cn(
        'flex mb-4 animate-slide-up',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn('flex gap-3 max-w-[80%]', isUser && 'flex-row-reverse')}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarFallback className={cn(
                  isUser ? 'bg-primary' : 'bg-accent'
                )}>
                  {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              {isUser ? '我' : 'AI助手'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex flex-col gap-1">
          {/* 消息气泡 */}
          <div
            className={cn(
              'rounded-lg px-4 py-3 border border-border shadow-soft',
              isUser ? 'bg-primary/10' : 'bg-surface'
            )}
          >
            <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words m-0">
              {message.content}
            </p>
          </div>

          {/* 时间和情绪标签 */}
          <div className={cn(
            'flex items-center gap-2 text-xs text-muted-foreground',
            isUser && 'flex-row-reverse'
          )}>
            <span>{formatTime(message.timestamp)}</span>
            {message.emotion && (
              <EmotionBadge
                emotion={message.emotion}
                intensity={message.emotionIntensity}
                showLabel
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageItem