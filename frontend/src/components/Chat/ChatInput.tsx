/**
 * ChatInput Component
 * 聊天输入组件
 */

import React, { useState } from 'react'
import { Input, Button, Space, Card } from 'antd'
import { SendOutlined } from '@ant-design/icons'

const { TextArea } = Input

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
    <Card
      style={{ borderTop: '1px solid #f0f0f0' }}
      bodyStyle={{ padding: 16 }}
    >
      <Space.Compact style={{ width: '100%' }}>
        <TextArea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{
            borderRadius: '12px 0 0 12px',
            resize: 'none'
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={disabled || !value.trim()}
          style={{
            height: 'auto',
            borderRadius: '0 12px 12px 0',
            minWidth: 80
          }}
        >
          发送
        </Button>
      </Space.Compact>
    </Card>
  )
}

export default ChatInput