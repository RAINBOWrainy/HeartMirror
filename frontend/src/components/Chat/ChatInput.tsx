/**
 * ChatInput Component
 * 聊天输入组件 - 使用 Tailwind + shadcn/ui
 */

import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { Button, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  placeholder = '输入您想说的话...',
  disabled = false,
  loading = false
}) => {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (value.trim() && !loading && !disabled) {
      onSend(value.trim())
      setValue('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-surface border-t border-border p-4">
      <div className="flex gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-h-[44px] max-h-32 resize-none"
          rows={1}
        />
        <Button
          onClick={handleSend}
          loading={loading}
          disabled={disabled || !value.trim()}
          className="shrink-0 h-11 px-4"
        >
          <Send className="w-4 h-4 mr-2" />
          发送
        </Button>
      </div>
    </div>
  )
}

export default ChatInput