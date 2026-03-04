/**
 * Skeleton Components
 * 骨架屏加载组件
 */

import React from 'react'
import { Skeleton, Card, Row, Col, Space } from 'antd'

interface ChatSkeletonProps {
  count?: number
}

/**
 * 聊天页面骨架屏
 */
export const ChatSkeleton: React.FC<ChatSkeletonProps> = ({ count = 4 }) => {
  return (
    <div style={{ padding: '16px 0' }}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
            marginBottom: 16
          }}
        >
          <Space
            align="start"
            style={{
              maxWidth: '80%',
              flexDirection: index % 2 === 0 ? 'row' : 'row-reverse'
            }}
          >
            <Skeleton.Avatar active size="default" />
            <div style={{ width: 200 + Math.random() * 100 }}>
              <Skeleton.Input active style={{ width: '100%', height: 60 }} />
            </div>
          </Space>
        </div>
      ))}
    </div>
  )
}

/**
 * 统计卡片骨架屏
 */
export const StatCardSkeleton: React.FC = () => {
  return (
    <Card style={{ borderRadius: 12, height: '100%' }} bodyStyle={{ padding: 20 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Skeleton.Input active size="small" style={{ width: 80 }} />
        <Skeleton.Input active size="large" style={{ width: 120 }} />
      </Space>
    </Card>
  )
}

/**
 * 图表骨架屏
 */
export const ChartSkeleton: React.FC = () => {
  return (
    <Card style={{ borderRadius: 12, height: '100%' }} bodyStyle={{ padding: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Skeleton.Input active style={{ width: 120, height: 24 }} />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Skeleton.Image active style={{ width: 200, height: 200, borderRadius: '50%' }} />
        </div>
      </Space>
    </Card>
  )
}

/**
 * 日记卡片骨架屏
 */
export const DiaryCardSkeleton: React.FC = () => {
  return (
    <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton.Input active size="small" style={{ width: 100 }} />
          <Skeleton.Input active size="small" style={{ width: 80 }} />
        </div>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Space>
          <Skeleton.Button active size="small" />
          <Skeleton.Button active size="small" />
        </Space>
      </Space>
    </Card>
  )
}

/**
 * 仪表盘骨架屏
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div>
      {/* 统计卡片骨架 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <StatCardSkeleton />
          </Col>
        ))}
      </Row>

      {/* 风险指示器骨架 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Space>
          <Skeleton.Input active style={{ width: 120 }} />
          <Skeleton.Button active style={{ width: 80 }} />
        </Space>
      </Card>

      {/* 图表骨架 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <ChartSkeleton />
        </Col>
        <Col xs={24} md={12}>
          <ChartSkeleton />
        </Col>
      </Row>
    </div>
  )
}

/**
 * 列表项骨架屏
 */
export const ListItemSkeleton: React.FC = () => {
  return (
    <Card style={{ marginBottom: 12, borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
      <Space style={{ width: '100%' }}>
        <Skeleton.Avatar active />
        <div style={{ flex: 1 }}>
          <Skeleton active paragraph={{ rows: 1 }} />
        </div>
      </Space>
    </Card>
  )
}

export default {
  Chat: ChatSkeleton,
  StatCard: StatCardSkeleton,
  Chart: ChartSkeleton,
  DiaryCard: DiaryCardSkeleton,
  Dashboard: DashboardSkeleton,
  ListItem: ListItemSkeleton
}