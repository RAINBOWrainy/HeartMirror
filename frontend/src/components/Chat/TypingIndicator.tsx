/**
 * TypingIndicator Component
 * AI正在输入的指示器组件
 */

import React from 'react'
import { Space, Typography } from 'antd'
import { RobotOutlined } from '@ant-design/icons'

const { Text } = Typography

interface TypingIndicatorProps {
  text?: string
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  text = 'AI正在思考...'
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: '12px 0'
      }}
    >
      <Space>
        <RobotOutlined style={{ color: '#52c41a', fontSize: 16 }} />
        <Text type="secondary" style={{ fontSize: 14 }}>
          {text}
        </Text>
        <span className="typing-dots">
          <span style={{ animation: 'blink 1s infinite' }}>.</span>
          <span style={{ animation: 'blink 1s infinite 0.2s' }}>.</span>
          <span style={{ animation: 'blink 1s infinite 0.4s' }}>.</span>
        </span>
      </Space>
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 0; }
          51%, 100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default TypingIndicator