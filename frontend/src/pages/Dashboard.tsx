import React from 'react'
import { Card, Row, Col, Statistic, Typography, Progress, Tag, Space } from 'antd'
import {
  MessageOutlined,
  BookOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { useRequest } from 'ahooks'
import ReactECharts from 'echarts-for-react'
import { dashboardApi } from '../services/api'

const { Title, Text } = Typography

const Dashboard: React.FC = () => {
  const { data: dashboardData, loading } = useRequest(() => dashboardApi.getDashboard())

  const getEmotionChartOption = () => {
    const distribution = dashboardData?.data?.emotion_distribution || {}
    return {
      title: {
        text: '情绪分布',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: '情绪',
          type: 'pie',
          radius: '50%',
          data: Object.entries(distribution).map(([name, value]) => ({
            name,
            value,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    }
  }

  const getTrendChartOption = () => {
    const trend = dashboardData?.data?.emotion_trend || []
    return {
      title: {
        text: '情绪趋势',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        data: trend.map((item: any) => item.date),
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 1,
      },
      series: [
        {
          name: '情绪强度',
          type: 'line',
          data: trend.map((item: any) => item.average_intensity),
          smooth: true,
          areaStyle: {
            opacity: 0.3,
          },
        },
      ],
    }
  }

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      green: '#52c41a',
      yellow: '#faad14',
      orange: '#fa8c16',
      red: '#f5222d',
    }
    return colors[level] || '#52c41a'
  }

  const getRiskLevelText = (level: string) => {
    const texts: Record<string, string> = {
      green: '良好',
      yellow: '关注',
      orange: '警示',
      red: '高风险',
    }
    return texts[level] || '良好'
  }

  return (
    <div>
      <Title level={4}>数据看板</Title>

      {/* 概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="对话次数"
              value={dashboardData?.data?.overview?.total_sessions || 0}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="日记数量"
              value={dashboardData?.data?.overview?.total_diaries || 0}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="干预完成"
              value={dashboardData?.data?.overview?.total_interventions || 0}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="连续打卡"
              value={dashboardData?.data?.overview?.current_streak || 0}
              prefix={<TrophyOutlined />}
              suffix="天"
            />
          </Card>
        </Col>
      </Row>

      {/* 风险等级 */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large">
          <Text>当前风险等级：</Text>
          <Tag
            color={getRiskLevelColor(dashboardData?.data?.overview?.risk_level)}
            style={{ fontSize: 16, padding: '4px 12px' }}
          >
            {getRiskLevelText(dashboardData?.data?.overview?.risk_level)}
          </Tag>
          <Text type="secondary">
            {dashboardData?.data?.overview?.risk_level === 'green'
              ? '继续保持，关注心理健康'
              : '建议进行情绪评估或寻求专业帮助'}
          </Text>
        </Space>
      </Card>

      {/* 图表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <ReactECharts option={getEmotionChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <ReactECharts option={getTrendChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 干预统计 */}
      <Card style={{ marginTop: 16 }} title="干预统计">
        <Row gutter={16}>
          <Col span={12}>
            <Progress
              type="circle"
              percent={
                dashboardData?.data?.intervention_stats?.completion_rate * 100 || 0
              }
              format={(percent) => `完成率 ${percent?.toFixed(0)}%`}
            />
          </Col>
          <Col span={12}>
            <Space direction="vertical">
              <Text>总干预次数：{dashboardData?.data?.intervention_stats?.total || 0}</Text>
              <Text>已完成：{dashboardData?.data?.intervention_stats?.completed || 0}</Text>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard