/**
 * EmotionBadge Component
 * 情绪标签显示组件
 */

import React from 'react'
import { Tag, Tooltip } from 'antd'
import {
  SmileOutlined,
  FrownOutlined,
  FireOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  HeartOutlined
} from '@ant-design/icons'

interface EmotionBadgeProps {
  emotion: string
  intensity?: number
  showLabel?: boolean
}

const emotionConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  joy: { color: 'gold', icon: <SmileOutlined />, label: '喜悦' },
  happiness: { color: 'gold', icon: <SmileOutlined />, label: '快乐' },
  sadness: { color: 'blue', icon: <FrownOutlined />, label: '悲伤' },
  anger: { color: 'red', icon: <FireOutlined />, label: '愤怒' },
  fear: { color: 'purple', icon: <AlertOutlined />, label: '恐惧' },
  anxiety: { color: 'orange', icon: <ThunderboltOutlined />, label: '焦虑' },
  neutral: { color: 'default', icon: <HeartOutlined />, label: '平静' },
  surprise: { color: 'cyan', icon: <ThunderboltOutlined />, label: '惊讶' },
}

const EmotionBadge: React.FC<EmotionBadgeProps> = ({
  emotion,
  intensity,
  showLabel = true
}) => {
  const config = emotionConfig[emotion] || emotionConfig.neutral
  const intensityPercent = intensity ? Math.round(intensity * 100) : null

  const content = (
    <Tag
      color={config.color}
      icon={config.icon}
      style={{
        borderRadius: 12,
        padding: '2px 8px',
        margin: 0
      }}
    >
      {showLabel && config.label}
      {intensityPercent !== null && ` ${intensityPercent}%`}
    </Tag>
  )

  if (intensity !== undefined) {
    return (
      <Tooltip title={`情绪强度: ${intensityPercent}%`}>
        {content}
      </Tooltip>
    )
  }

  return content
}

export default EmotionBadge