/**
 * Skeleton Components
 * 骨架屏加载组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import { Card, Skeleton } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ChatSkeletonProps {
  count?: number
}

/**
 * 聊天页面骨架屏
 */
export const ChatSkeleton: React.FC<ChatSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="py-4 space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'flex items-start gap-3',
            index % 2 === 0 ? 'justify-start' : 'justify-start flex-row-reverse'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="max-w-80">
            <div className="h-15 bg-muted animate-pulse rounded-lg" style={{ width: 200 + Math.random() * 100 }} />
          </div>
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
    <Card className="rounded-3 h-full p-5">
      <div className="space-y-3">
        <div className="w-20 h-4 bg-muted animate-pulse rounded" />
        <div className="w-30 h-8 bg-muted animate-pulse rounded" />
      </div>
    </Card>
  )
}

/**
 * 图表骨架屏
 */
export const ChartSkeleton: React.FC = () => {
  return (
    <Card className="rounded-3 h-full p-4">
      <div className="space-y-4">
        <div className="w-30 h-6 bg-muted animate-pulse rounded" />
        <div className="flex justify-center">
          <div className="w-50 h-50 bg-muted animate-pulse rounded-full" />
        </div>
      </div>
    </Card>
  )
}

/**
 * 日记卡片骨架屏
 */
export const DiaryCardSkeleton: React.FC = () => {
  return (
    <Card className="rounded-3 p-4">
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="w-25 h-4 bg-muted animate-pulse rounded" />
          <div className="w-20 h-4 bg-muted animate-pulse rounded" />
        </div>
        <Skeleton rows={2} />
        <div className="flex gap-2">
          <div className="w-16 h-8 bg-muted animate-pulse rounded-lg" />
          <div className="w-16 h-8 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* 风险指示器骨架 */}
      <Card className="mb-6 rounded-3 p-4">
        <div className="flex items-center gap-4">
          <div className="w-30 h-6 bg-muted animate-pulse rounded" />
          <div className="w-20 h-8 bg-muted animate-pulse rounded-lg" />
        </div>
      </Card>

      {/* 图表骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  )
}

/**
 * 列表项骨架屏
 */
export const ListItemSkeleton: React.FC = () => {
  return (
    <Card className="mb-3 rounded-3 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted animate-pulse rounded-full shrink-0" />
        <div className="flex-1">
          <Skeleton rows={1} />
        </div>
      </div>
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