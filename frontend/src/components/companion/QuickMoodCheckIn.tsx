/**
 * Quick Mood Check-In Component
 * 快捷心情签到组件 - 可复用版本
 */

import React, { useState } from 'react'
import { Typography, Space, Tooltip } from 'antd'
import { useNavigate } from 'react-router-dom'
import { brandColors } from '../../theme'

const { Text } = Typography

// 心情选项配置
export const MOOD_OPTIONS = [
  { emoji: '😊', label: '开心', value: 'joy', color: brandColors.emotionJoy },
  { emoji: '😌', label: '平静', value: 'calm', color: brandColors.emotionCalm },
  { emoji: '😔', label: '低落', value: 'sadness', color: brandColors.emotionSadness },
  { emoji: '😰', label: '焦虑', value: 'anxiety', color: brandColors.emotionAnxiety },
  { emoji: '😴', label: '疲惫', value: 'frustration', color: '#95DE64' },
]

interface QuickMoodCheckInProps {
  onMoodSelect?: (mood: string) => void
  navigateToChat?: boolean
  showLabel?: boolean
  size?: 'default' | 'small' | 'large'
  style?: React.CSSProperties
}

const QuickMoodCheckIn: React.FC<QuickMoodCheckInProps> = ({
  onMoodSelect,
  navigateToChat = true,
  showLabel = true,
  size = 'default',
  style,
}) => {
  const navigate = useNavigate()
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [hoveredMood, setHoveredMood] = useState<string | null>(null)

  const handleMoodClick = (mood: string) => {
    setSelectedMood(mood)

    if (onMoodSelect) {
      onMoodSelect(mood)
    }

    if (navigateToChat) {
      // 添加短暂延迟让用户看到选中效果
      setTimeout(() => {
        navigate(`/chat?mood=${mood}`)
      }, 300)
    }
  }

  // 根据尺寸计算样式
  const sizeConfig = {
    small: { buttonSize: 40, fontSize: 22, gap: 8 },
    default: { buttonSize: 52, fontSize: 26, gap: 12 },
    large: { buttonSize: 64, fontSize: 32, gap: 16 },
  }

  const config = sizeConfig[size]

  return (
    <div style={{ textAlign: 'center', ...style }}>
      {showLabel && (
        <Text
          style={{
            fontSize: size === 'large' ? 16 : 14,
            color: brandColors.primaryDark,
            marginBottom: 12,
            display: 'block',
          }}
        >
          今天感觉怎么样？
        </Text>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: config.gap,
        }}
      >
        {MOOD_OPTIONS.map((mood) => (
          <Tooltip key={mood.value} title={mood.label}>
            <button
              onClick={() => handleMoodClick(mood.value)}
              onMouseEnter={() => setHoveredMood(mood.value)}
              onMouseLeave={() => setHoveredMood(null)}
              style={{
                width: config.buttonSize,
                height: config.buttonSize,
                borderRadius: config.buttonSize * 0.3,
                border:
                  selectedMood === mood.value
                    ? `2px solid ${mood.color}`
                    : hoveredMood === mood.value
                      ? `2px solid ${mood.color}50`
                      : '2px solid transparent',
                background:
                  selectedMood === mood.value
                    ? `${mood.color}20`
                    : hoveredMood === mood.value
                      ? `${mood.color}10`
                      : '#fff',
                cursor: 'pointer',
                fontSize: config.fontSize,
                transition: 'all 0.25s ease',
                boxShadow:
                  selectedMood === mood.value
                    ? `0 4px 12px ${mood.color}30`
                    : hoveredMood === mood.value
                      ? `0 4px 12px ${mood.color}15`
                      : '0 2px 6px rgba(0,0,0,0.06)',
                transform:
                  selectedMood === mood.value
                    ? 'scale(1.1)'
                    : hoveredMood === mood.value
                      ? 'scale(1.08)'
                      : 'scale(1)',
              }}
            >
              {mood.emoji}
            </button>
          </Tooltip>
        ))}
      </div>
      {selectedMood && navigateToChat && (
        <Text
          type="secondary"
          style={{
            fontSize: 12,
            marginTop: 10,
            display: 'block',
            opacity: 0.8,
          }}
        >
          正在为你跳转到对话...
        </Text>
      )}
    </div>
  )
}

export default QuickMoodCheckIn