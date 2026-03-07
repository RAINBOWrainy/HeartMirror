/**
 * Progress Feedback Component
 * 进度反馈组件 - 轻量级本地存储实现
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Card, Progress, Typography, Space, Tag } from 'antd'
import {
  FireOutlined,
  TrophyOutlined,
  HeartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { brandColors } from '../../theme'

const { Text, Title } = Typography

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
  { threshold: 1, message: '开始就是进步！', icon: <HeartOutlined /> },
  { threshold: 3, message: '坚持得很棒！', icon: <FireOutlined /> },
  { threshold: 7, message: '一周打卡达成！', icon: <TrophyOutlined /> },
  { threshold: 14, message: '两周不间断，太厉害了！', icon: <TrophyOutlined /> },
  { threshold: 30, message: '一个月坚持，你真了不起！', icon: <TrophyOutlined /> },
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

  if (compact) {
    return (
      <Space>
        <FireOutlined style={{ color: brandColors.warning }} />
        <Text type="secondary">
          连续 {progress.consecutiveDays} 天
        </Text>
      </Space>
    )
  }

  return (
    <Card
      style={{
        borderRadius: 20,
        background: `linear-gradient(135deg, ${brandColors.primary}05 0%, ${brandColors.primaryLight}08 100%)`,
        border: `1px solid ${brandColors.primary}15`,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${brandColors.primary}15 0%, ${brandColors.primaryLight}20 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            color: brandColors.primary,
          }}
        >
          {currentEncouragement.icon}
        </div>
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ margin: '0 0 4px 0', color: brandColors.primaryDark }}>
            {currentEncouragement.message}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            已连续使用 <strong>{progress.consecutiveDays}</strong> 天
          </Text>
          <Progress
            percent={progressPercent}
            showInfo={false}
            strokeColor={{
              '0%': brandColors.primary,
              '100%': brandColors.primaryLight,
            }}
            trailColor={`${brandColors.primary}15`}
            size="small"
            style={{ marginTop: 8 }}
          />
        </div>
      </div>

      {/* 统计数据 */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 16,
          paddingTop: 16,
          borderTop: `1px solid ${brandColors.primary}10`,
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>对话次数</Text>
          <div style={{ fontWeight: 600, color: brandColors.primary, fontSize: 18 }}>
            {progress.totalSessions}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>情绪签到</Text>
          <div style={{ fontWeight: 600, color: brandColors.success, fontSize: 18 }}>
            {progress.emotionalCheckIns}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>日记记录</Text>
          <div style={{ fontWeight: 600, color: brandColors.info, fontSize: 18 }}>
            {progress.diaryEntries}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ProgressFeedback