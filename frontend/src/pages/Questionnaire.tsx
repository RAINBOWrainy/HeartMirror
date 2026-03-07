import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Radio,
  Progress,
  Space,
  Tag,
  Modal,
  message,
  Empty,
  Spin,
  List,
  Descriptions,
} from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  FormOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { questionnaireApi } from '../services/api'

const { Title, Text, Paragraph } = Typography

interface QuestionnaireType {
  id: string
  name: string
  description: string
  question_count: number
}

interface QuestionnaireSession {
  id: string
  questionnaire_type: string
  current_question_index: number
  total_questions: number
  is_completed: boolean
  total_score?: number
  risk_level: string
  started_at: string
  completed_at?: string
}

interface CurrentQuestion {
  index: number
  text: string
  options: Array<{ value: number; label: string }>
}

interface SessionDetail {
  id: string
  questionnaire_type: string
  is_completed: boolean
  current_question?: CurrentQuestion
  progress: {
    current: number
    total: number
  }
  started_at: string
}

interface QuestionnaireResult {
  session_id: string
  questionnaire_type: string
  total_score: number
  risk_level: string
  interpretation: string
  dimension_scores?: Record<string, number>
  recommendations: string[]
}

const Questionnaire: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [mode, setMode] = useState<'conversational' | 'form'>('conversational')
  const [currentSession, setCurrentSession] = useState<QuestionnaireSession | null>(null)
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<QuestionnaireResult | null>(null)
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)

  // 获取问卷类型列表
  const { data: typesData, loading: typesLoading } = useRequest(
    () => questionnaireApi.getTypes(),
    {
      onError: (err) => {
        console.error('获取问卷类型失败', err)
      },
    }
  )

  // 获取问卷历史
  const { data: historyData, loading: historyLoading, refresh: refreshHistory } = useRequest(
    () => questionnaireApi.getHistory(),
    {
      onError: (err) => {
        console.error('获取历史记录失败', err)
      },
    }
  )

  // 开始问卷
  const { run: startQuestionnaire, loading: starting } = useRequest(
    (questionnaireType: string, assessmentMode: string) =>
      questionnaireApi.start({ questionnaire_type: questionnaireType, mode: assessmentMode }),
    {
      manual: true,
      onSuccess: (res) => {
        setCurrentSession(res.data)
        loadSessionDetail(res.data.id)
        setAssessmentModalOpen(true)
        setAnswers({})
        setResult(null)
      },
      onError: () => {
        message.error('开始评估失败，请重试')
      },
    }
  )

  // 加载会话详情
  const { run: loadSessionDetail, loading: loadingDetail } = useRequest(
    (sessionId: string) => questionnaireApi.getSession(sessionId),
    {
      manual: true,
      onSuccess: (res) => {
        setSessionDetail(res.data)
      },
      onError: () => {
        message.error('加载问题失败')
      },
    }
  )

  // 提交答案
  const { run: submitAnswer, loading: submitting } = useRequest(
    (sessionId: string, questionIndex: number, answerValue: number) =>
      questionnaireApi.submitAnswer({
        session_id: sessionId,
        question_index: questionIndex,
        answer_value: answerValue,
      }),
    {
      manual: true,
      onSuccess: (res) => {
        if (res.data.is_completed) {
          // 问卷完成，获取结果
          loadResult(res.data.id)
        } else {
          // 继续下一题
          setCurrentSession(res.data)
          loadSessionDetail(res.data.id)
        }
      },
      onError: () => {
        message.error('提交答案失败')
      },
    }
  )

  // 加载结果
  const { run: loadResult, loading: loadingResult } = useRequest(
    (sessionId: string) => questionnaireApi.getResult(sessionId),
    {
      manual: true,
      onSuccess: (res) => {
        setResult(res.data)
        setResultModalOpen(true)
        setAssessmentModalOpen(false)
        refreshHistory()
      },
      onError: () => {
        message.error('获取结果失败')
      },
    }
  )

  const types = typesData?.data || []
  const history = historyData?.data || []

  const handleStartAssessment = (typeId: string, assessmentMode: 'conversational' | 'form') => {
    setSelectedType(typeId)
    setMode(assessmentMode)
    startQuestionnaire(typeId, assessmentMode)
  }

  const handleAnswer = (value: number) => {
    if (currentSession && sessionDetail?.current_question) {
      const questionIndex = sessionDetail.current_question.index
      setAnswers({ ...answers, [questionIndex]: value })
      submitAnswer(currentSession.id, questionIndex, value)
    }
  }

  const riskColors: Record<string, string> = {
    green: 'success',
    yellow: 'warning',
    orange: 'warning',
    red: 'error',
  }

  const riskLabels: Record<string, string> = {
    green: '低风险',
    yellow: '轻度风险',
    orange: '中度风险',
    red: '高风险',
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <FileTextOutlined /> 心理评估
      </Title>

      <Paragraph type="secondary">
        专业的心理评估量表，帮助你更好地了解自己的心理状态
      </Paragraph>

      {/* 可用评估 */}
      <Title level={4} style={{ marginTop: 24 }}>可用评估</Title>
      <Spin spinning={typesLoading}>
        <Row gutter={[16, 16]}>
          {types.map((type: QuestionnaireType) => (
            <Col xs={24} sm={12} md={8} key={type.id}>
              <Card
                hoverable
                style={{ height: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Title level={5}>{type.name}</Title>
                  <Text type="secondary">{type.description}</Text>
                  <Space>
                    <Tag><MessageOutlined /> {type.question_count}道题</Tag>
                    <Tag><ClockCircleOutlined /> 约{type.question_count}分钟</Tag>
                  </Space>

                  <div style={{ marginTop: 16 }}>
                    <Text>选择模式：</Text>
                  </div>
                  <Space style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      icon={<MessageOutlined />}
                      onClick={() => handleStartAssessment(type.id, 'conversational')}
                    >
                      对话式
                    </Button>
                    <Button
                      icon={<FormOutlined />}
                      onClick={() => handleStartAssessment(type.id, 'form')}
                    >
                      表单式
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      {/* 评估历史 */}
      <Title level={4} style={{ marginTop: 32 }}>评估历史</Title>
      <Spin spinning={historyLoading}>
        {history.length > 0 ? (
          <List
            dataSource={history}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    type="link"
                    onClick={() => {
                      loadResult(item.id)
                      setResultModalOpen(true)
                    }}
                  >
                    查看详情
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text>{item.questionnaire_type.toUpperCase()}</Text>
                      <Tag color={riskColors[item.risk_level]}>
                        {riskLabels[item.risk_level]}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space>
                      <Text type="secondary">
                        得分：{item.total_score || '-'}
                      </Text>
                      <Text type="secondary">
                        {item.completed_at
                          ? `完成于 ${new Date(item.completed_at).toLocaleDateString()}`
                          : '未完成'}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无评估记录" />
        )}
      </Spin>

      {/* 评估弹窗 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            {sessionDetail?.questionnaire_type?.toUpperCase() || '评估'}
          </Space>
        }
        open={assessmentModalOpen}
        onCancel={() => setAssessmentModalOpen(false)}
        footer={null}
        width={600}
      >
        <Spin spinning={loadingDetail || submitting}>
          {sessionDetail && (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 进度 */}
              <Progress
                percent={(sessionDetail.progress.current / sessionDetail.progress.total) * 100}
                format={() => `${sessionDetail.progress.current} / ${sessionDetail.progress.total}`}
              />

              {/* 当前问题 */}
              {sessionDetail.current_question && (
                <Card>
                  <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
                    {sessionDetail.current_question.text}
                  </Paragraph>

                  <Radio.Group
                    onChange={(e) => handleAnswer(e.target.value)}
                    value={answers[sessionDetail.current_question.index]}
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {sessionDetail.current_question.options.map((option) => (
                        <Radio
                          key={option.value}
                          value={option.value}
                          style={{ fontSize: 14 }}
                        >
                          {option.label}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Card>
              )}
            </Space>
          )}
        </Spin>
      </Modal>

      {/* 结果弹窗 */}
      <Modal
        title="评估结果"
        open={resultModalOpen}
        onCancel={() => setResultModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setResultModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        <Spin spinning={loadingResult}>
          {result && (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 总分和风险等级 */}
              <Descriptions bordered column={1}>
                <Descriptions.Item label="总分">
                  <Text strong style={{ fontSize: 18 }}>{result.total_score}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="风险等级">
                  <Tag color={riskColors[result.risk_level]} style={{ fontSize: 14 }}>
                    {riskLabels[result.risk_level]}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              {/* 解读 */}
              <Card title="结果解读">
                <Paragraph>{result.interpretation}</Paragraph>
              </Card>

              {/* 建议 */}
              <Card title="建议">
                <List
                  dataSource={result.recommendations}
                  renderItem={(item) => (
                    <List.Item>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      {item}
                    </List.Item>
                  )}
                />
              </Card>

              {/* 维度得分 */}
              {result.dimension_scores && (
                <Card title="维度得分">
                  <List
                    dataSource={Object.entries(result.dimension_scores)}
                    renderItem={([key, value]) => (
                      <List.Item>
                        <Text>{key}</Text>
                        <Progress percent={(value as number) * 10} size="small" style={{ width: 200 }} />
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </Space>
          )}
        </Spin>
      </Modal>
    </div>
  )
}

export default Questionnaire