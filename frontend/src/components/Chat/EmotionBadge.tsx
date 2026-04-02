/**
 * EmotionBadge Component
 * 情绪标签显示组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import { Smile, Frown, Flame, AlertTriangle, Zap, Heart } from 'lucide-react'
import { Badge } from '@/components/ui'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

interface EmotionBadgeProps {
  emotion: string
  intensity?: number
  showLabel?: boolean
}

// 情绪配置
const emotionConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'default' | 'joy' | 'sadness' | 'anxiety' | 'calm'; icon: React.ReactNode; label: string }> = {
  joy: { variant: 'joy', icon: <Smile className="w-3.5 h-3.5" />, label: '喜悦' },
  happiness: { variant: 'joy', icon: <Smile className="w-3.5 h-3.5" />, label: '快乐' },
  sadness: { variant: 'sadness', icon: <Frown className="w-3.5 h-3.5" />, label: '悲伤' },
  anger: { variant: 'error', icon: <Flame className="w-3.5 h-3.5" />, label: '愤怒' },
  fear: { variant: 'sadness', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: '恐惧' },
  anxiety: { variant: 'anxiety', icon: <Zap className="w-3.5 h-3.5" />, label: '焦虑' },
  neutral: { variant: 'calm', icon: <Heart className="w-3.5 h-3.5" />, label: '平静' },
  calm: { variant: 'calm', icon: <Heart className="w-3.5 h-3.5" />, label: '平静' },
  surprise: { variant: 'default', icon: <Zap className="w-3.5 h-3.5" />, label: '惊讶' },
}

const EmotionBadge: React.FC<EmotionBadgeProps> = ({
  emotion,
  intensity,
  showLabel = true
}) => {
  const config = emotionConfig[emotion] || emotionConfig.neutral
  const intensityPercent = intensity ? Math.round(intensity * 100) : null

  const content = (
    <Badge variant={config.variant} className="text-sm px-3 py-1">
      {config.icon}
      {showLabel && <span className="ml-1">{config.label}</span>}
      {intensityPercent !== null && (
        <span className="ml-1 opacity-80">{intensityPercent}%</span>
      )}
    </Badge>
  )

  if (intensity !== undefined) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            情绪强度: {intensityPercent}%
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

export default EmotionBadge