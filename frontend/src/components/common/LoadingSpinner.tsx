/**
 * LoadingSpinner Component
 * 通用加载指示器组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import { Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large'
  tip?: string
  fullScreen?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  tip,
  fullScreen = false
}) => {
  const spinnerSize = size === 'large' ? 'lg' : size === 'small' ? 'sm' : 'default'

  if (fullScreen) {
    return (
      <div className="flex justify-center items-center min-h-screen w-full bg-surface">
        <Spinner size={spinnerSize} />
        {tip && <span className="ml-2 text-muted-foreground">{tip}</span>}
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Spinner size={spinnerSize} />
      {tip && <span className="ml-2 text-muted-foreground">{tip}</span>}
    </div>
  )
}

export default LoadingSpinner