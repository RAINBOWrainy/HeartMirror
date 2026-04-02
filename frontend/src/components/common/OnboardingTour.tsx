/**
 * OnboardingTour Component
 * 新手引导教程组件 - 使用 Tailwind + shadcn/ui
 */

import React, { useState, useEffect } from 'react'
import {
  MessageSquare,
  Book,
  LayoutDashboard,
  AlertTriangle,
  Heart,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Progress,
} from '@/components/ui'
import { cn } from '@/lib/utils'

interface TourStep {
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const tourSteps: TourStep[] = [
  {
    title: '欢迎来到心镜',
    description: '心镜是一款AI心理健康自助管理工具，帮助您记录情绪、管理压力、获得支持。',
    icon: <Heart className="w-9 h-9" />,
    color: '#5B8C5A' // Primary sage green
  },
  {
    title: 'AI 对话',
    description: '与 AI 助手进行温暖对话，它会倾听您的烦恼并提供支持性建议。',
    icon: <MessageSquare className="w-9 h-9" />,
    color: '#5B8C5A' // Primary sage green
  },
  {
    title: '情绪日记',
    description: '记录每一天的心情，AI 会自动分析您的情绪，帮助您更好地了解自己。',
    icon: <Book className="w-9 h-9" />,
    color: '#6B9BD2' // Info blue from DESIGN.md
  },
  {
    title: '数据看板',
    description: '查看情绪趋势图表，了解您的心理健康状态变化。',
    icon: <LayoutDashboard className="w-9 h-9" />,
    color: '#E07A5F' // Warning terracotta from DESIGN.md
  },
  {
    title: '危机支持',
    description: '当您需要时，这里提供心理援助热线和应对策略。',
    icon: <AlertTriangle className="w-9 h-9" />,
    color: '#C84B31' // Error red from DESIGN.md
  }
]

interface OnboardingTourProps {
  visible?: boolean
  onComplete?: () => void
  storageKey?: string
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  visible,
  onComplete,
  storageKey = 'heartmirror-onboarding-completed'
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 检查是否已完成引导
    const completed = localStorage.getItem(storageKey)
    if (!completed && visible !== false) {
      setIsVisible(true)
    }
  }, [visible, storageKey])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true')
    setIsVisible(false)
    onComplete?.()
  }

  const handleSkip = () => {
    handleComplete()
  }

  const step = tourSteps[currentStep]
  const progress = ((currentStep + 1) / tourSteps.length) * 100

  return (
    <Dialog
      open={isVisible}
      onOpenChange={(open) => !open && handleSkip()}
    >
      <DialogContent className="max-w-md text-center">
        {/* 进度条 */}
        <Progress value={progress} className="mb-6" />

        {/* 步骤指示 */}
        <p className="text-sm text-muted-foreground">
          步骤 {currentStep + 1} / {tourSteps.length}
        </p>

        {/* 图标 */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto my-6"
          style={{
            backgroundColor: `${step.color}15`,
            color: step.color
          }}
        >
          {step.icon}
        </div>

        {/* 标题 */}
        <DialogTitle className="font-heading text-xl font-semibold text-foreground mb-3">
          {step.title}
        </DialogTitle>

        {/* 描述 */}
        <p className="text-muted-foreground text-base leading-relaxed mb-8">
          {step.description}
        </p>

        {/* 按钮组 */}
        <div className="flex justify-center gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handlePrev}>
              上一步
            </Button>
          )}
          <Button onClick={handleNext}>
            {currentStep === tourSteps.length - 1 ? '开始使用' : '下一步'}
          </Button>
        </div>

        {/* 跳过按钮 */}
        {currentStep < tourSteps.length - 1 && (
          <Button variant="ghost" onClick={handleSkip} className="mt-4">
            跳过引导
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingTour