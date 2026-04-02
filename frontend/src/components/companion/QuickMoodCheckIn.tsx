/**
 * Quick Mood Check-In Component
 * 快捷心情签到组件 - 使用 Tailwind + shadcn/ui
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// 心情选项配置
export const MOOD_OPTIONS = [
  { emoji: '😊', label: '开心', value: 'joy', color: 'var(--emotion-joy)' },
  { emoji: '😌', label: '平静', value: 'calm', color: 'var(--emotion-calm)' },
  { emoji: '😔', label: '低落', value: 'sadness', color: 'var(--emotion-sadness)' },
  { emoji: '😰', label: '焦虑', value: 'anxiety', color: 'var(--emotion-anxiety)' },
  { emoji: '😴', label: '疲惫', value: 'frustration', color: '#95DE64' },
]

interface QuickMoodCheckInProps {
  onMoodSelect?: (mood: string) => void
  navigateToChat?: boolean
  showLabel?: boolean
  size?: 'default' | 'small' | 'large'
  className?: string
}

const QuickMoodCheckIn: React.FC<QuickMoodCheckInProps> = ({
  onMoodSelect,
  navigateToChat = true,
  showLabel = true,
  size = 'default',
  className,
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
    <div className={cn('text-center', className)}>
      {showLabel && (
        <p className={cn(
          'text-foreground mb-3',
          size === 'large' ? 'text-base' : 'text-sm'
        )}>
          今天感觉怎么样？
        </p>
      )}
      <div
        className="flex justify-center"
        style={{ gap: config.gap }}
      >
        {MOOD_OPTIONS.map((mood) => (
          <Tooltip key={mood.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleMoodClick(mood.value)}
                onMouseEnter={() => setHoveredMood(mood.value)}
                onMouseLeave={() => setHoveredMood(null)}
                className="rounded-2xl transition-all duration-250"
                style={{
                  width: config.buttonSize,
                  height: config.buttonSize,
                  fontSize: config.fontSize,
                  borderWidth: 2,
                  borderStyle: 'solid',
                  borderColor: selectedMood === mood.value
                    ? mood.color
                    : hoveredMood === mood.value
                      ? `${mood.color}80`
                      : 'transparent',
                  backgroundColor: selectedMood === mood.value
                    ? `${mood.color}20`
                    : hoveredMood === mood.value
                      ? `${mood.color}10`
                      : 'white',
                  boxShadow: selectedMood === mood.value
                    ? `0 4px 12px ${mood.color}30`
                    : hoveredMood === mood.value
                      ? `0 4px 12px ${mood.color}15`
                      : '0 2px 6px rgba(0,0,0,0.06)',
                  transform: selectedMood === mood.value
                    ? 'scale(1.1)'
                    : hoveredMood === mood.value
                      ? 'scale(1.08)'
                      : 'scale(1)',
                }}
              >
                {mood.emoji}
              </button>
            </TooltipTrigger>
            <TooltipContent>{mood.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      {selectedMood && navigateToChat && (
        <p className="text-sm text-muted-foreground mt-2.5 opacity-80">
          正在为你跳转到对话...
        </p>
      )}
    </div>
  )
}

export default QuickMoodCheckIn