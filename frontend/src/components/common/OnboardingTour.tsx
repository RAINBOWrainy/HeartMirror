/**
 * OnboardingTour Component
 * 新手引导教程组件
 */

import React, { useState, useEffect } from 'react'
import { Modal, Button, Typography, Space, Card, Progress } from 'antd'
import {
  MessageOutlined,
  BookOutlined,
  DashboardOutlined,
  AlertOutlined,
  HeartOutlined,
  CheckOutlined
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

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
    icon: <HeartOutlined />,
    color: '#1890ff'
  },
  {
    title: 'AI 对话',
    description: '与 AI 助手进行温暖对话，它会倾听您的烦恼并提供支持性建议。',
    icon: <MessageOutlined />,
    color: '#52c41a'
  },
  {
    title: '情绪日记',
    description: '记录每一天的心情，AI 会自动分析您的情绪，帮助您更好地了解自己。',
    icon: <BookOutlined />,
    color: '#722ed1'
  },
  {
    title: '数据看板',
    description: '查看情绪趋势图表，了解您的心理健康状态变化。',
    icon: <DashboardOutlined />,
    color: '#fa8c16'
  },
  {
    title: '危机支持',
    description: '当您需要时，这里提供心理援助热线和应对策略。',
    icon: <AlertOutlined />,
    color: '#f5222d'
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
    <Modal
      open={isVisible}
      onCancel={handleSkip}
      footer={null}
      width={500}
      centered
      closable={false}
      maskClosable={false}
      styles={{
        body: { padding: 0 }
      }}
    >
      <div style={{ textAlign: 'center', padding: 32 }}>
        {/* 进度条 */}
        <Progress
          percent={progress}
          showInfo={false}
          strokeColor={{
            '0%': '#1890ff',
            '100%': '#52c41a'
          }}
          style={{ marginBottom: 24 }}
        />

        {/* 步骤指示 */}
        <Text type="secondary">
          步骤 {currentStep + 1} / {tourSteps.length}
        </Text>

        {/* 图标 */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `${step.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '24px auto',
          fontSize: 36,
          color: step.color
        }}>
          {step.icon}
        </div>

        {/* 标题 */}
        <Title level={3} style={{ marginBottom: 12 }}>
          {step.title}
        </Title>

        {/* 描述 */}
        <Paragraph
          type="secondary"
          style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}
        >
          {step.description}
        </Paragraph>

        {/* 按钮组 */}
        <Space size={12}>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              上一步
            </Button>
          )}
          <Button type="primary" onClick={handleNext}>
            {currentStep === tourSteps.length - 1 ? '开始使用' : '下一步'}
          </Button>
        </Space>

        {/* 跳过按钮 */}
        {currentStep < tourSteps.length - 1 && (
          <div style={{ marginTop: 16 }}>
            <Button type="link" onClick={handleSkip}>
              跳过引导
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default OnboardingTour