import React, { useState } from 'react'
import {
  Card,
  Tabs,
  Button,
  Space,
  Typography,
  message,
  Tag,
  Progress,
  Modal,
  Rate,
  Empty,
  Spin,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  HeartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { interventionApi } from '../services/api'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

interface InterventionPlan {
  id: string
  name: string
  intervention_type: string
  content: {
    name: string
    description: string
    steps?: string[]
    duration: number
  }
  difficulty_level: number
  estimated_duration: number
  is_active: boolean
  effectiveness_score?: number
  created_at: string
}

interface InterventionSession {
  id: string
  plan_id: string
  is_completed: boolean
  emotion_before?: string
  emotion_after?: string
  intensity_before?: number
  intensity_after?: number
  user_rating?: number
  started_at: string
  completed_at?: string
}

interface InterventionStats {
  total: number
  completed: number
  completion_rate: number
  by_type: Record<string, number>
}

const interventionTypeNames: Record<string, string> = {
  cbt: '认知行为疗法',
  mindfulness: '正念冥想',
  breathing: '呼吸练习',
  exercise: '运动锻炼',
  social: '社交活动',
  self_care: '自我关怀',
  education: '心理教育',
  behavioral: '行为激活',
}

const Intervention: React.FC = () => {
  const [activeTab, setActiveTab] = useState('recommended')
  const [selectedPlan, setSelectedPlan] = useState<InterventionPlan | null>(null)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [currentSession, setCurrentSession] = useState<InterventionSession | null>(null)
  const [userRating, setUserRating] = useState<number>(0)

  // 获取干预计划列表
  const { data: plansData, loading: plansLoading, refresh: refreshPlans } = useRequest(
    () => interventionApi.getPlans({ active_only: false }),
    {
      onError: (err) => {
        console.error('获取干预计划失败', err)
      },
    }
  )

  // 获取推荐计划
  const { data: recommendationsData, loading: recommendationsLoading } = useRequest(
    () => interventionApi.getRecommendations(),
    {
      onError: (err) => {
        console.error('获取推荐计划失败', err)
      },
    }
  )

  // 获取统计
  const { data: statsData, loading: statsLoading } = useRequest(
    () => interventionApi.getStats(),
    {
      onError: (err) => {
        console.error('获取统计数据失败', err)
      },
    }
  )

  // 开始干预会话
  const { run: startSession, loading: startingSession } = useRequest(
    (planId: string) => interventionApi.startSession(planId),
    {
      manual: true,
      onSuccess: (res) => {
        setCurrentSession(res.data)
        setSessionModalOpen(true)
        message.success('开始干预练习')
      },
      onError: () => {
        message.error('开始失败，请重试')
      },
    }
  )

  // 完成干预会话
  const { run: completeSession, loading: completingSession } = useRequest(
    (sessionId: string, data: any) => interventionApi.completeSession(sessionId, data),
    {
      manual: true,
      onSuccess: () => {
        message.success('完成干预练习')
        setCompleteModalOpen(false)
        setSessionModalOpen(false)
        setCurrentSession(null)
        setUserRating(0)
        refreshPlans()
      },
      onError: () => {
        message.error('提交失败，请重试')
      },
    }
  )

  const plans = plansData?.data || []
  const recommendations = recommendationsData?.data || []
  const stats: InterventionStats = statsData?.data || { total: 0, completed: 0, completion_rate: 0, by_type: {} }

  const activePlans = plans.filter((p: InterventionPlan) => p.is_active)
  const completedPlans = plans.filter((p: InterventionPlan) => !p.is_active)

  const handleStartPlan = (plan: InterventionPlan) => {
    setSelectedPlan(plan)
    startSession(plan.id)
  }

  const handleCompletePlan = () => {
    if (currentSession) {
      completeSession(currentSession.id, {
        user_rating: userRating,
      })
    }
  }

  const renderPlanCard = (plan: InterventionPlan) => (
    <Card
      key={plan.id}
      style={{ marginBottom: 16 }}
      hoverable
      onClick={() => setSelectedPlan(plan)}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Tag color="blue">{interventionTypeNames[plan.intervention_type] || plan.intervention_type}</Tag>
          <Tag><ClockCircleOutlined /> {plan.estimated_duration}分钟</Tag>
        </Space>
        <Title level={5}>{plan.name}</Title>
        <Text type="secondary" ellipsis>
          {plan.content?.description}
        </Text>
        <Space>
          <Text type="secondary">难度：</Text>
          <Progress
            percent={plan.difficulty_level * 20}
            size="small"
            style={{ width: 100 }}
            showInfo={false}
          />
        </Space>
        {plan.effectiveness_score && (
          <Space>
            <StarOutlined style={{ color: '#faad14' }} />
            <Text>效果评分：{(plan.effectiveness_score * 100).toFixed(0)}%</Text>
          </Space>
        )}
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            handleStartPlan(plan)
          }}
        >
          开始练习
        </Button>
      </Space>
    </Card>
  )

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <HeartOutlined /> 干预计划
      </Title>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="总练习次数"
              value={stats.total}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="完成率"
              value={stats.completion_rate * 100}
              precision={0}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="为你推荐" key="recommended">
          <Spin spinning={recommendationsLoading}>
            {recommendations.length > 0 ? (
              recommendations.map((plan: InterventionPlan) => renderPlanCard(plan))
            ) : (
              <Empty description="暂无推荐计划，先聊聊天让我们更了解你吧" />
            )}
          </Spin>
        </TabPane>

        <TabPane tab="进行中" key="active">
          <Spin spinning={plansLoading}>
            {activePlans.length > 0 ? (
              activePlans.map((plan: InterventionPlan) => renderPlanCard(plan))
            ) : (
              <Empty description="暂无进行中的计划" />
            )}
          </Spin>
        </TabPane>

        <TabPane tab="历史记录" key="history">
          <Spin spinning={plansLoading}>
            {completedPlans.length > 0 ? (
              completedPlans.map((plan: InterventionPlan) => renderPlanCard(plan))
            ) : (
              <Empty description="暂无历史记录" />
            )}
          </Spin>
        </TabPane>
      </Tabs>

      {/* 干预详情弹窗 */}
      <Modal
        title={selectedPlan?.name}
        open={!!selectedPlan && !sessionModalOpen}
        onCancel={() => setSelectedPlan(null)}
        footer={[
          <Button key="cancel" onClick={() => setSelectedPlan(null)}>
            关闭
          </Button>,
          <Button
            key="start"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => selectedPlan && handleStartPlan(selectedPlan)}
          >
            开始练习
          </Button>,
        ]}
        width={600}
      >
        {selectedPlan && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Tag color="blue">{interventionTypeNames[selectedPlan.intervention_type]}</Tag>
            <Paragraph>{selectedPlan.content?.description}</Paragraph>

            {selectedPlan.content?.steps && (
              <>
                <Title level={5}>练习步骤</Title>
                <ol>
                  {selectedPlan.content.steps.map((step, index) => (
                    <li key={index} style={{ marginBottom: 8 }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </>
            )}

            <Space>
              <ClockCircleOutlined />
              <Text>预计时长：{selectedPlan.estimated_duration}分钟</Text>
            </Space>
          </Space>
        )}
      </Modal>

      {/* 进行中会话弹窗 */}
      <Modal
        title="正在练习"
        open={sessionModalOpen}
        onCancel={() => {
          setSessionModalOpen(false)
          setCurrentSession(null)
        }}
        footer={[
          <Button key="cancel" onClick={() => setCompleteModalOpen(true)}>
            完成练习
          </Button>,
        ]}
        width={600}
      >
        {selectedPlan && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={4}>{selectedPlan.name}</Title>
            <Paragraph>{selectedPlan.content?.description}</Paragraph>

            {selectedPlan.content?.steps && (
              <>
                <Title level={5}>练习步骤</Title>
                <ol>
                  {selectedPlan.content.steps.map((step, index) => (
                    <li key={index} style={{ marginBottom: 8 }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </>
            )}

            <Progress type="circle" percent={50} format={() => '进行中'} />
          </Space>
        )}
      </Modal>

      {/* 完成反馈弹窗 */}
      <Modal
        title="练习反馈"
        open={completeModalOpen}
        onOk={handleCompletePlan}
        onCancel={() => setCompleteModalOpen(false)}
        confirmLoading={completingSession}
        okText="提交"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>这次练习对你有帮助吗？请评分：</Text>
          <Rate
            value={userRating}
            onChange={setUserRating}
            allowHalf
          />
          <Text type="secondary">
            {userRating >= 4 ? '很高兴对你有帮助！' : userRating >= 2 ? '感谢反馈，我们会持续改进' : '我们会继续努力'}
          </Text>
        </Space>
      </Modal>
    </div>
  )
}

export default Intervention