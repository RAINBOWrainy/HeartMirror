/**
 * Questionnaire Page
 * 心理评估页面 - 使用 Tailwind + shadcn/ui
 */

import React, { useState } from 'react'
import {
  FileText,
  Clock,
  CheckCircle,
  MessageSquare,
  Pencil,
} from 'lucide-react'
import { useRequest } from 'ahooks'
import { questionnaireApi } from '@/services/api'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Progress,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Spinner,
  Skeleton,
} from '@/components/ui'
import { cn } from '@/lib/utils'

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
        alert('获取问卷类型失败')
        console.error('获取问卷类型失败', err)
      },
    }
  )

  // 获取问卷历史
  const { data: historyData, loading: historyLoading, refresh: refreshHistory } = useRequest(
    () => questionnaireApi.getHistory(),
    {
      onError: (err) => {
        alert('获取历史记录失败')
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
        alert('开始评估失败，请重试')
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
        alert('加载问题失败')
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
        alert('提交答案失败')
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
        alert('获取结果失败')
      },
    }
  )

  const types = Array.isArray(typesData?.data) ? typesData.data : []
  const history = Array.isArray(historyData?.data) ? historyData.data : []

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

  const riskVariants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
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
    <div className="max-w-3xl mx-auto py-6">
      <h2 className="font-heading text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
        <FileText className="w-6 h-6 text-primary" />
        心理评估
      </h2>

      <p className="text-muted-foreground mb-6">
        专业的心理评估量表，帮助你更好地了解自己的心理状态
      </p>

      {/* 可用评估 */}
      <h3 className="font-heading text-lg font-semibold text-foreground mb-4">可用评估</h3>
      {typesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton rows={4} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type: QuestionnaireType) => (
            <Card
              key={type.id}
              className="cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200"
            >
              <CardContent className="space-y-3">
                <p className="font-heading text-lg font-semibold text-foreground">{type.name}</p>
                <p className="text-muted-foreground text-sm">{type.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {type.question_count}道题
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    约{type.question_count}分钟
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mt-4">选择模式：</p>
                <div className="flex gap-2">
                  <Button onClick={() => handleStartAssessment(type.id, 'conversational')}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    对话式
                  </Button>
                  <Button variant="outline" onClick={() => handleStartAssessment(type.id, 'form')}>
                    <Pencil className="w-4 h-4 mr-2" />
                    表单式
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 评估历史 */}
      <h3 className="font-heading text-lg font-semibold text-foreground mt-8 mb-4">评估历史</h3>
      {historyLoading ? (
        <div className="flex items-center justify-center p-10">
          <Spinner size="lg" />
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-3">
          {history.map((item: any) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-soft transition-all duration-200"
              onClick={() => {
                loadResult(item.id)
                setResultModalOpen(true)
              }}
            >
              <CardContent className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{item.questionnaire_type.toUpperCase()}</span>
                    <Badge variant={riskVariants[item.risk_level]}>
                      {riskLabels[item.risk_level]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted-foreground">得分：{item.total_score || '-'}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.completed_at
                        ? `完成于 ${new Date(item.completed_at).toLocaleDateString()}`
                        : '未完成'}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  查看详情
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">暂无评估记录</p>
        </Card>
      )}

      {/* 评估弹窗 */}
      <Dialog open={assessmentModalOpen} onOpenChange={setAssessmentModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {sessionDetail?.questionnaire_type?.toUpperCase() || '评估'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loadingDetail || submitting ? (
              <div className="flex items-center justify-center py-10">
                <Spinner size="lg" />
              </div>
            ) : sessionDetail && (
              <>
                {/* 进度 */}
                <Progress
                  value={(sessionDetail.progress.current / sessionDetail.progress.total) * 100}
                  showLabel={`${sessionDetail.progress.current} / ${sessionDetail.progress.total}`}
                />

                {/* 当前问题 */}
                {sessionDetail.current_question && (
                  <Card className="p-6">
                    <p className="text-lg text-foreground mb-6">
                      {sessionDetail.current_question.text}
                    </p>

                    <div className="space-y-3">
                      {sessionDetail.current_question.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleAnswer(option.value)}
                          className={cn(
                            'w-full p-3 rounded-lg border text-left transition-all duration-200',
                            answers[sessionDetail.current_question?.index ?? 0] === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50 hover:bg-surface'
                          )}
                        >
                          <span className="text-foreground">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 结果弹窗 */}
      <Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>评估结果</DialogTitle>
          </DialogHeader>
          {loadingResult ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : result && (
            <div className="space-y-4">
              {/* 总分和风险等级 */}
              <Card className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">总分</p>
                    <p className="text-xl font-semibold text-foreground">{result.total_score}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">风险等级</p>
                    <Badge variant={riskVariants[result.risk_level]} className="text-base">
                      {riskLabels[result.risk_level]}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* 解读 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">结果解读</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground">{result.interpretation}</p>
                </CardContent>
              </Card>

              {/* 建议 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">建议</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  {result.recommendations.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 维度得分 */}
              {result.dimension_scores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">维度得分</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-3">
                    {Object.entries(result.dimension_scores).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-foreground">{key}</span>
                        <Progress value={(value as number) * 10} className="w-24" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultModalOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Questionnaire