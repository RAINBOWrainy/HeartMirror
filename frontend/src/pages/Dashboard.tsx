/**
 * Dashboard Page
 * 数据看板页面 - 重构版本
 */

import React from 'react'
import { Card, Row, Col, Typography, Progress, Space } from 'antd'
import {
  MessageOutlined,
  BookOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { dashboardApi } from '../services/api'
import { StatCard, EmotionChart, TrendChart, RiskIndicator } from '../components/Dashboard'

const { Title, Text } = Typography

const Dashboard: React.FC = () => {
  const { data: dashboardData, loading, error } = useRequest(() => dashboardApi.getDashboard(), {
    onError: (err) => {
      console.error('获取看板数据失败', err)
    },
  })

  const overview = dashboardData?.data?.overview || {}
  const interventionStats = dashboardData?.data?.intervention_stats || {}

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>数据看板</Title>

      {/* 概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="对话次数"
            value={overview.total_sessions || 0}
            prefix={<MessageOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="日记数量"
            value={overview.total_diaries || 0}
            prefix={<BookOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="干预完成"
            value={overview.total_interventions || 0}
            prefix={<ThunderboltOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="连续打卡"
            value={overview.current_streak || 0}
            prefix={<TrophyOutlined />}
            suffix="天"
            loading={loading}
          />
        </Col>
      </Row>

      {/* 风险等级 */}
      <div style={{ marginBottom: 24 }}>
        <RiskIndicator
          level={overview.risk_level}
          loading={loading}
        />
      </div>

      {/* 图表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <EmotionChart
            data={dashboardData?.data?.emotion_distribution}
            loading={loading}
          />
        </Col>
        <Col xs={24} md={12}>
          <TrendChart
            data={dashboardData?.data?.emotion_trend}
            loading={loading}
          />
        </Col>
      </Row>

      {/* 干预统计 */}
      <Card
        style={{ marginTop: 16, borderRadius: 12 }}
        title="干预统计"
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={(interventionStats.completion_rate || 0) * 100}
              format={(percent) => `完成率 ${percent?.toFixed(0)}%`}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068'
              }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" size="middle">
              <Text>
                总干预次数：{interventionStats.total || 0}
              </Text>
              <Text>
                已完成：{interventionStats.completed || 0}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard