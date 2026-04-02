/**
 * TypingIndicator Component
 * AI正在输入的指示器组件 - 使用 Tailwind
 */

import React from 'react'
import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  text?: string
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  text = 'AI正在思考...'
}) => {
  return (
    <div className="flex items-center gap-2 py-3">
      <Bot className="w-4 h-4 text-accent" />
      <span className="text-sm text-muted-foreground">{text}</span>
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
    </div>
  )
}

export default TypingIndicator