/**
 * RiskIndicator Component
 * 风险等级指示器组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import { AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'

interface RiskIndicatorProps {
  level?: string
  loading?: boolean
}

const riskConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'default'; text: string; advice: string; icon: React.ReactNode; bgClass: string }> = {
  green: {
    variant: 'success',
    text: '良好',
    advice: '继续保持，关注心理健康',
    icon: <CheckCircle className="w-5 h-5" />,
    bgClass: 'bg-success-soft'
  },
  yellow: {
    variant: 'warning',
    text: '关注',
    advice: '建议进行情绪评估',
    icon: <Info className="w-5 h-5" />,
    bgClass: 'bg-warning-soft'
  },
  orange: {
    variant: 'warning',
    text: '警示',
    advice: '建议进行情绪评估或寻求专业帮助',
    icon: <AlertTriangle className="w-5 h-5" />,
    bgClass: 'bg-warning-soft'
  },
  red: {
    variant: 'error',
    text: '高风险',
    advice: '强烈建议寻求专业帮助',
    icon: <AlertCircle className="w-5 h-5" />,
    bgClass: 'bg-error-soft'
  }
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  level = 'green',
  loading = false
}) => {
  const config = riskConfig[level] || riskConfig.green

  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-48" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border p-4',
        config.bgClass
      )}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-foreground">当前风险等级：</span>
        <Badge variant={config.variant} className="text-base px-4 py-1">
          <span className="flex items-center gap-2">
            {config.icon}
            {config.text}
          </span>
        </Badge>
        <span className="text-muted-foreground text-sm">
          {config.advice}
        </span>
      </div>
    </div>
  )
}

export default RiskIndicator