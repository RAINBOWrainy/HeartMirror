/**
 * StatCard Component
 * 统计卡片组件
 */

import React from 'react'
import { Card, Statistic } from 'antd'
import type { StatisticProps } from 'antd'

interface StatCardProps {
  title: string
  value: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  loading = false
}) => {
  return (
    <Card
      loading={loading}
      style={{
        borderRadius: 12,
        height: '100%'
      }}
      bodyStyle={{ padding: 20 }}
    >
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ fontSize: 28 }}
      />
    </Card>
  )
}

export default StatCard