/**
 * RiskIndicator Component
 * 风险等级指示器组件
 */

import React from 'react'
import { Card, Tag, Space, Typography } from 'antd'

const { Text } = Typography

interface RiskIndicatorProps {
  level?: string
  loading?: boolean
}

const riskConfig: Record<string, { color: string; text: string; advice: string }> = {
  green: {
    color: 'success',
    text: '良好',
    advice: '继续保持，关注心理健康'
  },
  yellow: {
    color: 'warning',
    text: '关注',
    advice: '建议进行情绪评估'
  },
  orange: {
    color: 'orange',
    text: '警示',
    advice: '建议进行情绪评估或寻求专业帮助'
  },
  red: {
    color: 'error',
    text: '高风险',
    advice: '强烈建议寻求专业帮助'
  }
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  level = 'green',
  loading = false
}) => {
  const config = riskConfig[level] || riskConfig.green

  return (
    <Card
      loading={loading}
      style={{
        borderRadius: 12,
        background: level === 'red'
          ? '#fff2f0'
          : level === 'orange'
            ? '#fff7e6'
            : level === 'yellow'
              ? '#fffbe6'
              : '#f6ffed'
      }}
      bodyStyle={{ padding: 16 }}
    >
      <Space size="large">
        <Text>当前风险等级：</Text>
        <Tag
          color={config.color}
          style={{
            fontSize: 16,
            padding: '4px 16px',
            borderRadius: 8
          }}
        >
          {config.text}
        </Tag>
        <Text type="secondary">
          {config.advice}
        </Text>
      </Space>
    </Card>
  )
}

export default RiskIndicator