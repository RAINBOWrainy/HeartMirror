/**
 * StatCard Component
 * 统计卡片组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui'

interface StatCardProps {
  title: string
  value: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  loading?: boolean
  className?: string
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  loading = false,
  className
}) => {
  return (
    <div
      className={cn(
        'bg-surface rounded-lg p-6 h-full',
        'border border-border shadow-card',
        'transition-all duration-200 ease-out',
        'hover:shadow-elevated hover:-translate-y-0.5',
        className
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="default" />
        </div>
      ) : (
        <div>
          <div className="text-muted-foreground text-sm mb-2">
            {title}
          </div>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-primary mr-2">{prefix}</span>}
            <span className="text-3xl font-bold text-primary">
              {value.toLocaleString()}
            </span>
            {suffix && <span className="text-primary text-lg ml-1">{suffix}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default StatCard