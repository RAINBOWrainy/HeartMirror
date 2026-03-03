import React from 'react'
import { Card, Typography, Row, Col, Statistic, Button, Space, Alert } from 'antd'
import {
  MessageOutlined,
  BookOutlined,
  DashboardOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const { Title, Paragraph, Text } = Typography

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const features = [
    {
      icon: <MessageOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: 'AI对话',
      description: '与AI助手交流，识别情绪状态，获取个性化建议',
      action: () => navigate('/chat'),
    },
    {
      icon: <BookOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      title: '情绪日记',
      description: '记录每日心情，追踪情绪变化趋势',
      action: () => navigate('/diary'),
    },
    {
      icon: <DashboardOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      title: '数据看板',
      description: '可视化情绪数据，了解心理健康状态',
      action: () => navigate('/dashboard'),
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      title: '危机支持',
      description: '获取心理援助热线和紧急资源',
      action: () => navigate('/crisis'),
    },
  ]

  return (
    <div>
      <Alert
        message="重要声明"
        description="HeartMirror是一款心理健康自助管理工具，不替代专业临床诊断和治疗。如有严重心理问题，请及时寻求专业医疗帮助。"
        type="warning"
        showIcon
        closable
        style={{ marginBottom: 24 }}
      />

      <Card style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          👋 你好，{user?.anonymous_id || '用户'}
        </Title>
        <Paragraph type="secondary">
          欢迎使用HeartMirror心镜，您的AI心理健康自助管理助手。
          今天您感觉如何？让我们一起关注您的心理健康。
        </Paragraph>
        <Button type="primary" size="large" onClick={() => navigate('/chat')}>
          开始对话
        </Button>
      </Card>

      <Title level={4}>功能入口</Title>
      <Row gutter={[16, 16]}>
        {features.map((feature, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              hoverable
              style={{ height: '100%' }}
              onClick={feature.action}
            >
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                {feature.icon}
                <Title level={5} style={{ margin: 0 }}>{feature.title}</Title>
                <Text type="secondary" style={{ textAlign: 'center' }}>
                  {feature.description}
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 24, background: '#f6ffed', borderColor: '#b7eb8f' }}>
        <Title level={5} style={{ margin: 0 }}>💡 今日提示</Title>
        <Paragraph style={{ margin: '8px 0 0 0' }}>
          每天花几分钟关注自己的情绪，是心理健康的第一步。试试记录今天的情绪日记吧！
        </Paragraph>
      </Card>
    </div>
  )
}

export default Home