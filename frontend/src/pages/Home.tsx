/**
 * Home Page
 * 首页 - 使用 Tailwind + shadcn/ui
 * 清澈、平静、现代设计
 */

import React, { useState, useMemo } from 'react'
import {
  MessageSquare,
  Book,
  LayoutDashboard,
  Heart,
  Lightbulb,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { OnboardingTour } from '@/components/common'
import { MOOD_CONFIG } from '@/components/common/MoodIcons'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

// 每日鼓励语
const DAILY_ENCOURAGEMENTS = [
  '每一天都是新的开始，你做得很好',
  '感受情绪是勇敢的第一步',
  '慢慢来，不着急，我们一起走',
  '照顾好自己也是一种能力',
  '有时候，停下来休息也是一种进步',
  '你的感受很重要，值得被倾听',
  '小步前进，也是前进',
  '今天也要好好爱自己',
]

// 获取今日鼓励语
const getTodayEncouragement = () => {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  )
  return DAILY_ENCOURAGEMENTS[dayOfYear % DAILY_ENCOURAGEMENTS.length]
}

// 快速心情签到组件
const QuickMoodCheckIn: React.FC<{ onMoodSelect: (mood: string) => void }> = ({ onMoodSelect }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  const handleMoodClick = (mood: string) => {
    setSelectedMood(mood)
    setTimeout(() => onMoodSelect(mood), 300)
  }

  return (
    <Card className="p-7 text-center">
      <p className="text-lg font-medium text-foreground">
        今天感觉怎么样？
      </p>
      <div className="flex justify-center gap-4 mt-6">
        {MOOD_CONFIG.slice(0, 5).map((mood) => {
          const IconComponent = mood.Icon
          const isSelected = selectedMood === mood.value
          return (
            <button
              key={mood.value}
              onClick={() => handleMoodClick(mood.value)}
              aria-label={mood.label}
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center min-h-11 min-w-11',
                'cursor-pointer transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isSelected
                  ? 'border-2 scale-[0.95] shadow-soft'
                  : 'border border-border bg-muted'
              )}
              style={{
                borderColor: isSelected ? mood.color : undefined,
                backgroundColor: isSelected ? mood.softColor : undefined,
              }}
            >
              <IconComponent size={30} color={mood.color} />
            </button>
          )
        })}
      </div>
      {selectedMood && (
        <p className="text-sm text-primary mt-4">
          正在为你跳转到对话...
        </p>
      )}
    </Card>
  )
}

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [showTour, setShowTour] = useState(true)
  const encouragement = useMemo(() => getTodayEncouragement(), [])

  const features = [
    {
      icon: MessageSquare,
      title: 'AI对话',
      description: '与AI助手交流，识别情绪状态',
      action: () => navigate('/chat'),
      color: 'primary',
    },
    {
      icon: Book,
      title: '情绪日记',
      description: '记录每日心情，追踪变化趋势',
      action: () => navigate('/diary'),
      color: 'accent',
    },
    {
      icon: LayoutDashboard,
      title: '数据看板',
      description: '可视化情绪数据，了解心理状态',
      action: () => navigate('/dashboard'),
      color: 'success',
    },
  ]

  const handleMoodSelect = (mood: string) => {
    navigate(`/chat?mood=${mood}`)
  }

  return (
    <div className="pb-8 max-w-3xl mx-auto">
      {/* 新手引导 */}
      <OnboardingTour
        visible={showTour}
        onComplete={() => setShowTour(false)}
      />

      {/* 欢迎区域 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-15 h-15 rounded-2xl flex items-center justify-center text-white shadow-soft"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)'
            }}
          >
            <Heart className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-semibold text-foreground m-0 mb-2">
              嗨，{user?.nickname || user?.anonymous_id || '朋友'}～
            </h1>
            <p className="text-muted-foreground text-base m-0">
              {encouragement}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={() => navigate('/chat')}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            开始对话
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowTour(true)}
          >
            查看引导
          </Button>
        </div>
      </div>

      {/* 快速心情签到 */}
      <div className="mb-8">
        <QuickMoodCheckIn onMoodSelect={handleMoodSelect} />
      </div>

      {/* 功能入口 */}
      <div className="mb-5">
        <p className="text-lg font-semibold text-foreground">
          功能入口
        </p>
      </div>
      <div className="flex gap-4 flex-wrap">
        {features.map((feature, index) => {
          const IconComponent = feature.icon
          return (
            <button
              key={index}
              onClick={feature.action}
              className={cn(
                'flex-1 min-w-[200px] bg-surface border border-border rounded-2xl p-6',
                'cursor-pointer text-left shadow-card',
                'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-13 h-13 rounded-3.5 flex items-center justify-center',
                    feature.color === 'primary' ? 'bg-primary/10 text-primary' :
                    feature.color === 'accent' ? 'bg-accent/10 text-accent' :
                    'bg-success/10 text-success'
                  )}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-base text-foreground mb-2">
                    {feature.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 今日提示 */}
      <Card
        className="mt-8 p-6 bg-transparent"
        style={{ backgroundColor: 'var(--color-info-soft)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-3 bg-surface flex items-center justify-center text-primary shadow-soft">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-primary">
              今日小贴士
            </p>
            <p className="text-muted-foreground text-sm mt-1.5">
              每天花几分钟关注自己的情绪，是心理健康的第一步。试试记录今天的情绪日记吧！
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Home