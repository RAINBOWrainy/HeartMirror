import React, { useState, useMemo } from 'react'
import { Card, Typography, Row, Col, Button, Space, Alert, Divider, Badge } from 'antd'
import {
  MessageOutlined,
  BookOutlined,
  DashboardOutlined,
  SafetyOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { OnboardingTour } from '../components/common'
import { brandColors } from '../theme'

const { Title, Paragraph, Text } = Typography

// 心情选项配置
const MOOD_OPTIONS = [
  { emoji: '😊', label: '开心', value: 'joy', color: brandColors.emotionJoy },
  { emoji: '😌', label: '平静', value: 'calm', color: brandColors.emotionCalm },
  { emoji: '😔', label: '低落', value: 'sadness', color: brandColors.emotionSadness },
  { emoji: '😰', label: '焦虑', value: 'anxiety', color: brandColors.emotionAnxiety },
  { emoji: '😴', label: '疲惫', value: 'frustration', color: '#95DE64' },
]

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
    <Card
      style={{
        borderRadius: 20,
        background: `linear-gradient(135deg, ${brandColors.primaryLight}15 0%, ${brandColors.primary}10 100%)`,
        border: `1px solid ${brandColors.primary}20`,
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <div style={{ textAlign: 'center' }}>
        <Text style={{ fontSize: 15, color: brandColors.primaryDark }}>
          今天感觉怎么样？
        </Text>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.value}
              onClick={() => handleMoodClick(mood.value)}
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                border: selectedMood === mood.value ? `2px solid ${mood.color}` : '2px solid transparent',
                background: selectedMood === mood.value ? `${mood.color}20` : '#fff',
                cursor: 'pointer',
                fontSize: 26,
                transition: 'all 0.25s ease',
                boxShadow: selectedMood === mood.value ? `0 4px 12px ${mood.color}30` : '0 2px 6px rgba(0,0,0,0.06)',
                transform: selectedMood === mood.value ? 'scale(1.1)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (selectedMood !== mood.value) {
                  e.currentTarget.style.transform = 'scale(1.08)'
                  e.currentTarget.style.boxShadow = `0 4px 12px ${mood.color}20`
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMood !== mood.value) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)'
                }
              }}
              title={mood.label}
            >
              {mood.emoji}
            </button>
          ))}
        </div>
        {selectedMood && (
          <Text type="secondary" style={{ fontSize: 13, marginTop: 12, display: 'block' }}>
            正在为你跳转到对话...
          </Text>
        )}
      </div>
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
      icon: <MessageOutlined style={{ fontSize: 28 }} />,
      title: 'AI对话',
      description: '与AI助手交流，识别情绪状态',
      action: () => navigate('/chat'),
      gradient: `linear-gradient(135deg, ${brandColors.primary}15 0%, ${brandColors.primaryLight}15 100%)`,
      iconBg: brandColors.primary,
    },
    {
      icon: <BookOutlined style={{ fontSize: 28 }} />,
      title: '情绪日记',
      description: '记录每日心情，追踪变化趋势',
      action: () => navigate('/diary'),
      gradient: `linear-gradient(135deg, ${brandColors.success}15 0%, ${brandColors.successLight}15 100%)`,
      iconBg: brandColors.success,
    },
    {
      icon: <DashboardOutlined style={{ fontSize: 28 }} />,
      title: '数据看板',
      description: '可视化情绪数据，了解心理状态',
      action: () => navigate('/dashboard'),
      gradient: `linear-gradient(135deg, ${brandColors.info}15 0%, ${brandColors.infoLight}15 100%)`,
      iconBg: brandColors.info,
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 28 }} />,
      title: '危机支持',
      description: '获取心理援助热线和紧急资源',
      action: () => navigate('/crisis'),
      gradient: `linear-gradient(135deg, ${brandColors.warning}15 0%, ${brandColors.warningLight}15 100%)`,
      iconBg: brandColors.warning,
    },
  ]

  const handleMoodSelect = (mood: string) => {
    navigate(`/chat?mood=${mood}`)
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* 新手引导 */}
      <OnboardingTour
        visible={showTour}
        onComplete={() => setShowTour(false)}
      />

      {/* 免责声明 */}
      <Alert
        message="温馨提醒"
        description="HeartMirror是一款心理健康自助管理工具，不替代专业临床诊断和治疗。如有严重心理问题，请及时寻求专业医疗帮助。"
        type="warning"
        showIcon
        closable
        style={{ marginBottom: 20, borderRadius: 16 }}
      />

      {/* 欢迎卡片 - 温暖渐变背景 */}
      <Card
        style={{
          marginBottom: 20,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${brandColors.primary}08 0%, ${brandColors.primaryLight}12 100%)`,
          border: `1px solid ${brandColors.primary}15`,
          overflow: 'hidden',
        }}
        styles={{ body: { padding: 28 } }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.primaryLight} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              color: '#fff',
              boxShadow: `0 8px 20px ${brandColors.primary}30`,
            }}
          >
            <HeartOutlined />
          </div>
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: '0 0 8px 0', color: brandColors.primaryDark }}>
              嗨，{user?.anonymous_id || '朋友'}～
            </Title>
            <Paragraph style={{ margin: 0, color: '#666', fontSize: 15 }}>
              {encouragement}
            </Paragraph>
          </div>
        </div>
        <Divider style={{ margin: '20px 0', borderColor: `${brandColors.primary}15` }} />
        <Space size={12}>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/chat')}
            style={{
              borderRadius: 12,
              height: 44,
              paddingLeft: 24,
              paddingRight: 24,
              boxShadow: `0 4px 12px ${brandColors.primary}30`,
            }}
          >
            <MessageOutlined style={{ marginRight: 8 }} />
            开始对话
          </Button>
          <Button
            size="large"
            onClick={() => setShowTour(true)}
            style={{ borderRadius: 12, height: 44 }}
          >
            查看引导
          </Button>
        </Space>
      </Card>

      {/* 快速心情签到 */}
      <div style={{ marginBottom: 24 }}>
        <QuickMoodCheckIn onMoodSelect={handleMoodSelect} />
      </div>

      {/* 功能入口 */}
      <Title level={4} style={{ marginBottom: 16, color: '#333' }}>
        功能入口
      </Title>
      <Row gutter={[16, 16]}>
        {features.map((feature, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              hoverable
              style={{
                height: '100%',
                borderRadius: 20,
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease',
              }}
              styles={{ body: { padding: 24 } }}
              onClick={feature.action}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 12px 28px ${feature.iconBg}15`
                e.currentTarget.style.borderColor = `${feature.iconBg}30`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = '#f0f0f0'
              }}
            >
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: feature.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: feature.iconBg,
                  }}
                >
                  {feature.icon}
                </div>
                <Title level={5} style={{ margin: '8px 0 4px 0', color: '#333' }}>
                  {feature.title}
                </Title>
                <Text type="secondary" style={{ textAlign: 'center', fontSize: 13 }}>
                  {feature.description}
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 今日提示卡片 */}
      <Card
        style={{
          marginTop: 24,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${brandColors.success}10 0%, ${brandColors.successLight}08 100%)`,
          border: `1px solid ${brandColors.success}20`,
        }}
        styles={{ body: { padding: 20 } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `${brandColors.success}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: brandColors.success,
              fontSize: 20,
            }}
          >
            💡
          </div>
          <div>
            <Text strong style={{ color: brandColors.success, fontSize: 15 }}>
              今日小贴士
            </Text>
            <Paragraph style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>
              每天花几分钟关注自己的情绪，是心理健康的第一步。试试记录今天的情绪日记吧！
            </Paragraph>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Home