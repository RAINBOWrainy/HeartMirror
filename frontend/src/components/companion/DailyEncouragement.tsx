/**
 * Daily Encouragement Component
 * 每日鼓励横幅组件
 */

import React, { useMemo } from 'react'
import { Typography, Space } from 'antd'
import { HeartOutlined, SunOutlined, StarOutlined, BulbOutlined } from '@ant-design/icons'
import { brandColors } from '../../theme'

const { Text } = Typography

// 鼓励语库
const ENCOURAGEMENTS = [
  { text: '每一天都是新的开始', icon: <SunOutlined /> },
  { text: '你的感受很重要', icon: <HeartOutlined /> },
  { text: '慢慢来，不着急', icon: <StarOutlined /> },
  { text: '照顾好自己也是一门功课', icon: <BulbOutlined /> },
  { text: '有时候休息也是一种进步', icon: <HeartOutlined /> },
  { text: '你比想象中更坚强', icon: <StarOutlined /> },
  { text: '小步前进，也是前进', icon: <SunOutlined /> },
  { text: '今天也要好好爱自己', icon: <HeartOutlined /> },
  { text: '感受当下，接纳自己', icon: <BulbOutlined /> },
  { text: '每个情绪都值得被看见', icon: <StarOutlined /> },
  { text: '你正在变得更好', icon: <SunOutlined /> },
  { text: '给自己一个拥抱吧', icon: <HeartOutlined /> },
  { text: '勇敢表达自己', icon: <BulbOutlined /> },
  { text: '你有能力度过难关', icon: <StarOutlined /> },
  { text: '今天做的每一件小事都很棒', icon: <SunOutlined /> },
]

interface DailyEncouragementProps {
  style?: React.CSSProperties
  compact?: boolean
}

const DailyEncouragement: React.FC<DailyEncouragementProps> = ({ style, compact = false }) => {
  // 根据日期获取今日鼓励语
  const encouragement = useMemo(() => {
    const today = new Date()
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    )
    return ENCOURAGEMENTS[dayOfYear % ENCOURAGEMENTS.length]
  }, [])

  if (compact) {
    return (
      <Space style={{ ...style }} size={6}>
        <span style={{ color: brandColors.primary }}>{encouragement.icon}</span>
        <Text style={{ color: '#666', fontSize: 13 }}>{encouragement.text}</Text>
      </Space>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 16,
        background: `linear-gradient(135deg, ${brandColors.primary}08 0%, ${brandColors.primaryLight}10 100%)`,
        border: `1px solid ${brandColors.primary}12`,
        ...style,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${brandColors.primary}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: brandColors.primary,
          fontSize: 18,
        }}
      >
        {encouragement.icon}
      </div>
      <Text style={{ color: '#555', fontSize: 14, flex: 1 }}>
        {encouragement.text}
      </Text>
    </div>
  )
}

export default DailyEncouragement