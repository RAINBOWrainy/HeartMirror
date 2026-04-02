/**
 * Progress Feedback Component
 * 进度反馈组件 - 使用 Tailwind + shadcn/ui
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Flame, Trophy, Heart } from 'lucide-react'
import { Card, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'

// 进度状态接口
interface ProgressState {
  lastVisit: string
  streak: number
  totalSessions: number
  emotionalCheckIns: number
  diaryEntries: number
  consecutiveDays: number
}

// 默认进度状态
const defaultProgress: ProgressState = {
  lastVisit: '',
  streak: 0,
  totalSessions: 0,
  emotionalCheckIns: 0,
  diaryEntries: 0,
  consecutiveDays: 0,
}

// 本地存储键
const PROGRESS_KEY = 'heartmirror_progress'

// 获取进度状态
export const getProgress = (): ProgressState => {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY)
    return stored ? JSON.parse(stored) : defaultProgress
  } catch {
    return defaultProgress
  }
}

// 更新进度状态
export const updateProgress = (update: Partial<ProgressState>): ProgressState => {
  const current = getProgress()
  const updated = { ...current, ...update }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated))
  return updated
}

// 记录访问
export const recordVisit = (): ProgressState => {
  const current = getProgress()
  const today = new Date().toDateString()

  if (current.lastVisit === today) {
    return current
  }

  // 检查是否连续访问
  const lastVisitDate = current.lastVisit ? new Date(current.lastVisit) : null
  const todayDate = new Date(today)

  let consecutiveDays = current.consecutiveDays
  if (lastVisitDate) {
    const diffTime = todayDate.getTime() - lastVisitDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      consecutiveDays += 1
    } else if (diffDays > 1) {
      consecutiveDays = 1
    }
  } else {
    consecutiveDays = 1
  }

  return updateProgress({
    lastVisit: today,
    consecutiveDays,
    streak: consecutiveDays,
  })
}

// 记录对话会话
export const recordSession = (): ProgressState => {
  const current = getProgress()
  return updateProgress({
    totalSessions: current.totalSessions + 1,
  })
}

// 记录情绪签到
export const recordEmotionalCheckIn = (): ProgressState => {
  const current = getProgress()
  return updateProgress({
    emotionalCheckIns: current.emotionalCheckIns + 1,
  })
}

// 记录日记
export const recordDiaryEntry = (): ProgressState => {
  const current = getProgress()
  return updateProgress({
    diaryEntries: current.diaryEntries + 1,
  })
}

// 鼓励消息配置
const ENCOURAGEMENT_MESSAGES = [
  { threshold: 1, message: '开始就是进步！', icon: Heart },
  { threshold: 3, message: '坚持得很棒！', icon: Flame },
  { threshold: 7, message: '一周打卡达成！', icon: Trophy },
  { threshold: 14, message: '两周不间断，太厉害了！', icon: Trophy },
  { threshold: 30, message: '一个月坚持，你真了不起！', icon: Trophy },
]

interface ProgressFeedbackProps {
  compact?: boolean
}

const ProgressFeedback: React.FC<ProgressFeedbackProps> = ({ compact = false }) => {
  const [progress, setProgress] = useState<ProgressState>(defaultProgress)

  useEffect(() => {
    setProgress(recordVisit())
  }, [])

  // 获取当前鼓励消息
  const currentEncouragement = useMemo(() => {
    let result = ENCOURAGEMENT_MESSAGES[0]
    for (const msg of ENCOURAGEMENT_MESSAGES) {
      if (progress.consecutiveDays >= msg.threshold) {
        result = msg
      }
    }
    return result
  }, [progress.consecutiveDays])

  // 计算进度百分比（以30天为目标）
  const progressPercent = Math.min((progress.consecutiveDays / 30) * 100, 100)

  const IconComponent = currentEncouragement.icon

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-warning" />
        <span className="text-muted-foreground">连续 {progress.consecutiveDays} 天</span>
      </div>
    )
  }

  return (
    <Card
      className="rounded-5 bg-gradient-to-br from-primary/5 to-primary-light/10 border border-primary/15"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-15 h-15 rounded-4 flex items-center justify-center text-primary"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary)/15 0%, var(--color-primary-light)/20 100%)'
          }}
        >
          <IconComponent className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <p className="font-heading font-semibold text-foreground mb-1">
            {currentEncouragement.message}
          </p>
          <p className="text-muted-foreground text-sm">
            已连续使用 <strong className="text-foreground">{progress.consecutiveDays}</strong> 天
          </p>
          <Progress value={progressPercent} className="mt-2" />
        </div>
      </div>

      {/* 统计数据 */}
      <div className="flex gap-4 mt-4 pt-4 border-t border-primary/10">
        <div className="flex-1 text-center">
          <p className="text-muted-foreground text-xs mb-1">对话次数</p>
          <p className="font-semibold text-primary text-lg m-0">{progress.totalSessions}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-muted-foreground text-xs mb-1">情绪签到</p>
          <p className="font-semibold text-success text-lg m-0">{progress.emotionalCheckIns}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-muted-foreground text-xs mb-1">日记记录</p>
          <p className="font-semibold text-info text-lg m-0">{progress.diaryEntries}</p>
        </div>
      </div>
    </Card>
  )
}

export default ProgressFeedback