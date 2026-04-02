/**
 * Daily Encouragement Component
 * 每日鼓励横幅组件 - 使用 Tailwind + shadcn/ui
 */

import React, { useMemo } from 'react'
import { Heart, Sun, Star, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

// 鼓励语库
const ENCOURAGEMENTS = [
  { text: '每一天都是新的开始', icon: Sun },
  { text: '你的感受很重要', icon: Heart },
  { text: '慢慢来，不着急', icon: Star },
  { text: '照顾好自己也是一门功课', icon: Lightbulb },
  { text: '有时候休息也是一种进步', icon: Heart },
  { text: '你比想象中更坚强', icon: Star },
  { text: '小步前进，也是前进', icon: Sun },
  { text: '今天也要好好爱自己', icon: Heart },
  { text: '感受当下，接纳自己', icon: Lightbulb },
  { text: '每个情绪都值得被看见', icon: Star },
  { text: '你正在变得更好', icon: Sun },
  { text: '给自己一个拥抱吧', icon: Heart },
  { text: '勇敢表达自己', icon: Lightbulb },
  { text: '你有能力度过难关', icon: Star },
  { text: '今天做的每一件小事都很棒', icon: Sun },
]

interface DailyEncouragementProps {
  className?: string
  compact?: boolean
}

const DailyEncouragement: React.FC<DailyEncouragementProps> = ({ className, compact = false }) => {
  // 根据日期获取今日鼓励语
  const encouragement = useMemo(() => {
    const today = new Date()
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    )
    return ENCOURAGEMENTS[dayOfYear % ENCOURAGEMENTS.length]
  }, [])

  const IconComponent = encouragement.icon

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <IconComponent className="w-4 h-4 text-primary" />
        <span className="text-muted-foreground text-sm">{encouragement.text}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 p-4 rounded-2xl',
        'bg-gradient-to-br from-primary/5 to-primary-light/10',
        'border border-primary/10',
        className
      )}
    >
      <div className="w-9 h-9 rounded-2.5 bg-primary/15 flex items-center justify-center text-primary">
        <IconComponent className="w-4.5 h-4.5" />
      </div>
      <span className="text-muted-foreground text-sm flex-1">
        {encouragement.text}
      </span>
    </div>
  )
}

export default DailyEncouragement