/**
 * Dashboard Page
 * 数据看板页面 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import { useRequest } from 'ahooks'
import { useNavigate } from 'react-router-dom'
import { Rocket, MessageSquare, Book, Zap, FileText, Trophy } from 'lucide-react'
import { dashboardApi } from '@/services/api'
import { StatCard, EmotionChart, TrendChart, RiskIndicator } from '@/components/Dashboard'
import { Button, CircularProgress, Progress, Skeleton, Alert } from '@/components/ui'
import { cn } from '@/lib/utils'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { data: dashboardData, loading, error } = useRequest(() => dashboardApi.getDashboard(), {
    onError: (err) => {
      console.error('获取看板数据失败', err)
    },
  })

  const overview = dashboardData?.data?.overview || {}
  const interventionStats = dashboardData?.data?.interventionStats || {}
  const questionnaireStats = dashboardData?.data?.questionnaireStats || {}

  // Check if user is new (no data yet)
  const isNewUser = !loading && (
    (overview.totalSessions || 0) === 0 &&
    (overview.totalDiaries || 0) === 0 &&
    (overview.totalInterventions || 0) === 0
  )

  // Stat items configuration
  const statItems = [
    { title: '对话次数', value: overview.totalSessions || 0, icon: MessageSquare, color: 'text-primary' },
    { title: '日记数量', value: overview.totalDiaries || 0, icon: Book, color: 'text-accent' },
    { title: '干预完成', value: overview.totalInterventions || 0, icon: Zap, color: 'text-warning' },
    { title: '评估次数', value: questionnaireStats.totalSessions || 0, icon: FileText, color: 'text-info' },
    { title: '连续打卡', value: overview.currentStreak || 0, suffix: '天', icon: Trophy, color: 'text-success' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* 标题 */}
      <h1 className="font-heading text-2xl font-semibold text-foreground mb-6">
        数据看板
      </h1>

      {/* 新用户欢迎提示 */}
      {isNewUser && (
        <div className="mb-6 bg-gradient-to-r from-info-soft to-surface rounded-lg p-7 border border-border">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white shadow-soft">
              <Rocket className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-lg font-semibold text-foreground mb-1">
                开始你的心理健康之旅
              </p>
              <p className="text-sm text-muted-foreground">
                记录你的第一条日记或开始一次对话，数据将在这里展示
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/chat')}>
                开始对话
              </Button>
              <Button variant="outline" onClick={() => navigate('/diary')}>
                写日记
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statItems.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            suffix={item.suffix}
            prefix={<item.icon className={cn('w-5 h-5', item.color)} />}
            loading={loading}
          />
        ))}
      </div>

      {/* 风险等级 */}
      <div className="mb-6">
        <RiskIndicator level={overview.riskLevel} loading={loading} />
      </div>

      {/* 图表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <EmotionChart
          data={dashboardData?.data?.emotionDistribution}
          loading={loading}
        />
        <TrendChart
          data={dashboardData?.data?.emotionTrend}
          loading={loading}
        />
      </div>

      {/* 干预统计 */}
      <div className="bg-surface rounded-lg border border-border p-6 mb-6">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-5">
          干预统计
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex justify-center">
            <CircularProgress
              value={(interventionStats.completionRate || 0) * 100}
              formatValue={(v) => `完成率 ${Math.round(v)}%`}
              size={120}
            />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-muted-foreground">
              总干预次数：{interventionStats.total || 0}
            </p>
            <p className="text-muted-foreground">
              已完成：{interventionStats.completed || 0}
            </p>
          </div>
        </div>
      </div>

      {/* 评估统计 */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-5">
          评估统计
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex justify-center">
            <CircularProgress
              value={questionnaireStats.totalSessions > 0 ? 100 : 0}
              formatValue={() => `${questionnaireStats.completedSessions || 0}/${questionnaireStats.totalSessions || 0} 已完成`}
              size={120}
            />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-muted-foreground">
              总评估次数：{questionnaireStats.totalSessions || 0}
            </p>
            <p className="text-muted-foreground">
              已完成：{questionnaireStats.completedSessions || 0}
            </p>
            {questionnaireStats.latestPhq9Score !== undefined && questionnaireStats.latestPhq9Score !== null && (
              <p className="text-muted-foreground">
                最近PHQ-9得分：{questionnaireStats.latestPhq9Score}
              </p>
            )}
            {questionnaireStats.latestGad7Score !== undefined && questionnaireStats.latestGad7Score !== null && (
              <p className="text-muted-foreground">
                最近GAD-7得分：{questionnaireStats.latestGad7Score}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard