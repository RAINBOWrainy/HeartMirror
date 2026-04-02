/**
 * Intervention Page
 * 干预计划页面 - 使用 Tailwind + shadcn/ui
 */

import React, { useState } from 'react'
import {
  Heart,
  Clock,
  CheckCircle,
  Play,
  Star,
} from 'lucide-react'
import { useRequest } from 'ahooks'
import { interventionApi } from '@/services/api'
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
  DialogDescription,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
  Skeleton,
} from '@/components/ui'
import { cn } from '@/lib/utils'

interface InterventionPlan {
  id: string
  name: string
  interventionType: string
  description?: string
  difficultyLevel: number
  estimatedDuration: number
  isActive: boolean
  effectivenessScore?: number
  steps?: string[]
  createdAt: string
}

interface InterventionSession {
  id: string
  planId: string
  isCompleted: boolean
  emotionBefore?: string
  emotionAfter?: string
  intensityBefore?: number
  intensityAfter?: number
  userRating?: number
  startedAt: string
  completedAt?: string
}

interface InterventionStats {
  total: number
  completed: number
  completionRate: number
  byType: Record<string, number>
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

// 简单的评分组件
const RatingStars: React.FC<{
  value: number
  onChange: (value: number) => void
}> = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => onChange(star)}
        className={cn(
          'p-1 rounded transition-colors',
          star <= value ? 'text-warning' : 'text-muted hover:text-warning/50'
        )}
      >
        <Star className="w-6 h-6" fill={star <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
)

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
        alert('获取干预计划失败')
        console.error('获取干预计划失败', err)
      },
    }
  )

  // 获取推荐计划
  const { data: recommendationsData, loading: recommendationsLoading } = useRequest(
    () => interventionApi.getRecommendations(),
    {
      onError: (err) => {
        alert('获取推荐计划失败')
        console.error('获取推荐计划失败', err)
      },
    }
  )

  // 获取统计
  const { data: statsData, loading: statsLoading } = useRequest(
    () => interventionApi.getStats(),
    {
      onError: (err) => {
        alert('获取统计数据失败')
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
        alert('开始干预练习')
      },
      onError: () => {
        alert('开始失败，请重试')
      },
    }
  )

  // 完成干预会话
  const { run: completeSession, loading: completingSession } = useRequest(
    (sessionId: string, data: any) => interventionApi.completeSession(sessionId, data),
    {
      manual: true,
      onSuccess: () => {
        alert('完成干预练习')
        setCompleteModalOpen(false)
        setSessionModalOpen(false)
        setCurrentSession(null)
        setUserRating(0)
        refreshPlans()
      },
      onError: () => {
        alert('提交失败，请重试')
      },
    }
  )

  const plans = Array.isArray(plansData?.data) ? plansData.data : []
  const recommendations = Array.isArray(recommendationsData?.data) ? recommendationsData.data : []
  const stats: InterventionStats = statsData?.data || { total: 0, completed: 0, completionRate: 0, byType: {} }

  const activePlans = plans.filter((p: InterventionPlan) => p.isActive)
  const completedPlans = plans.filter((p: InterventionPlan) => !p.isActive)

  const handleStartPlan = (plan: InterventionPlan) => {
    setSelectedPlan(plan)
    startSession(plan.id)
  }

  const handleCompletePlan = () => {
    if (currentSession) {
      completeSession(currentSession.id, {
        userRating: userRating,
      })
    }
  }

  const renderPlanCard = (plan: InterventionPlan) => (
    <Card
      key={plan.id}
      className="mb-4 cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200"
      onClick={() => setSelectedPlan(plan)}
    >
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary">{interventionTypeNames[plan.interventionType] || plan.interventionType}</Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {plan.estimatedDuration}分钟
          </Badge>
        </div>
        <p className="font-heading text-lg font-semibold text-foreground">{plan.name}</p>
        <p className="text-muted-foreground text-sm truncate">{plan.description}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">难度：</span>
          <Progress value={plan.difficultyLevel * 20} className="w-24" />
        </div>
        {plan.effectivenessScore && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" fill="currentColor" />
            <span className="text-foreground">效果评分：{(plan.effectivenessScore * 100).toFixed(0)}%</span>
          </div>
        )}
        <Button
          onClick={(e) => {
            e.stopPropagation()
            handleStartPlan(plan)
          }}
        >
          <Play className="w-4 h-4 mr-2" />
          开始练习
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-3xl mx-auto py-6">
      <h2 className="font-heading text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 text-primary" />
        干预计划
      </h2>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-semibold text-foreground m-0">{stats.total}</p>
          <p className="text-sm text-muted-foreground m-0 mt-1">总练习次数</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-success m-0">{stats.completed}</p>
          <p className="text-sm text-muted-foreground m-0 mt-1">已完成</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold text-foreground m-0">{stats.completionRate * 100}%</p>
          <p className="text-sm text-muted-foreground m-0 mt-1">完成率</p>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="recommended">为你推荐</TabsTrigger>
          <TabsTrigger value="active">进行中</TabsTrigger>
          <TabsTrigger value="history">历史记录</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended">
          {recommendationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton rows={3} />
                </Card>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            recommendations.map((plan: InterventionPlan) => renderPlanCard(plan))
          ) : (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">暂无推荐计划，先聊聊天让我们更了解你吧</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active">
          {plansLoading ? (
            <div className="flex items-center justify-center p-10">
              <Spinner size="lg" />
            </div>
          ) : activePlans.length > 0 ? (
            activePlans.map((plan: InterventionPlan) => renderPlanCard(plan))
          ) : (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">暂无进行中的计划</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          {plansLoading ? (
            <div className="flex items-center justify-center p-10">
              <Spinner size="lg" />
            </div>
          ) : completedPlans.length > 0 ? (
            completedPlans.map((plan: InterventionPlan) => renderPlanCard(plan))
          ) : (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">暂无历史记录</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 干预详情弹窗 */}
      <Dialog
        open={!!selectedPlan && !sessionModalOpen}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.name}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <Badge variant="primary">{interventionTypeNames[selectedPlan.interventionType]}</Badge>
              <p className="text-muted-foreground">{selectedPlan.description}</p>

              {selectedPlan.steps && (
                <div>
                  <p className="font-medium text-foreground mb-2">练习步骤</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    {selectedPlan.steps.map((step, index) => (
                      <li key={index} className="text-foreground">{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">预计时长：{selectedPlan.estimatedDuration}分钟</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlan(null)}>关闭</Button>
            <Button onClick={() => selectedPlan && handleStartPlan(selectedPlan)}>
              <Play className="w-4 h-4 mr-2" />
              开始练习
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 进行中会话弹窗 */}
      <Dialog
        open={sessionModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSessionModalOpen(false)
            setCurrentSession(null)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>正在练习</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <p className="font-heading text-lg font-semibold text-foreground">{selectedPlan.name}</p>
              <p className="text-muted-foreground">{selectedPlan.description}</p>

              {selectedPlan.steps && (
                <div>
                  <p className="font-medium text-foreground mb-2">练习步骤</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    {selectedPlan.steps.map((step, index) => (
                      <li key={index} className="text-foreground">{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex justify-center">
                <Progress value={50} variant="circle" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteModalOpen(true)}>
              完成练习
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 完成反馈弹窗 */}
      <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>练习反馈</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-foreground">这次练习对你有帮助吗？请评分：</p>
            <RatingStars value={userRating} onChange={setUserRating} />
            <p className="text-muted-foreground">
              {userRating >= 4 ? '很高兴对你有帮助！' :
               userRating >= 2 ? '感谢反馈，我们会持续改进' :
               '我们会继续努力'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteModalOpen(false)}>取消</Button>
            <Button onClick={handleCompletePlan} loading={completingSession}>提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Intervention