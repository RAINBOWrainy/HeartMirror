/**
 * EmptyState Component
 * 通用空状态组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import {
  MessageSquare,
  Book,
  LayoutDashboard,
  AlertTriangle,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  type?: 'chat' | 'diary' | 'dashboard' | 'crisis' | 'search' | 'default'
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
}

const emptyConfigs = {
  chat: {
    icon: MessageSquare,
    title: '开始对话',
    description: '与 AI 助手开始一段温暖的对话',
    color: 'primary'
  },
  diary: {
    icon: Book,
    title: '记录心情',
    description: '写下今天的心情，让情绪被看见',
    color: 'accent'
  },
  dashboard: {
    icon: LayoutDashboard,
    title: '数据看板',
    description: '开始使用后，这里将展示您的情绪数据',
    color: 'primary'
  },
  crisis: {
    icon: AlertTriangle,
    title: '危机支持',
    description: '这里提供心理援助资源和应对策略',
    color: 'warning'
  },
  search: {
    icon: Search,
    title: '未找到结果',
    description: '请尝试其他关键词',
    color: 'muted-foreground'
  },
  default: {
    icon: undefined,
    title: '暂无数据',
    description: '这里还没有任何内容',
    color: 'muted-foreground'
  }
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'default',
  title,
  description,
  actionText,
  onAction
}) => {
  const config = emptyConfigs[type]
  const IconComponent = config.icon

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 min-h-75">
      {IconComponent && (
        <div
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-pulse',
            type === 'chat' ? 'bg-primary/10' :
            type === 'diary' ? 'bg-accent/10' :
            type === 'dashboard' ? 'bg-primary/10' :
            type === 'crisis' ? 'bg-warning/10' :
            'bg-muted'
          )}
        >
          <IconComponent
            className={cn(
              'w-12 h-12',
              type === 'chat' ? 'text-primary' :
              type === 'diary' ? 'text-accent' :
              type === 'dashboard' ? 'text-primary' :
              type === 'crisis' ? 'text-warning' :
              'text-muted-foreground'
            )}
          />
        </div>
      )}

      <p className="font-semibold text-base text-foreground mb-2">
        {title || config.title}
      </p>

      <p className="text-muted-foreground text-center mb-4 max-w-70">
        {description || config.description}
      </p>

      {actionText && onAction && (
        <Button onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  )
}

export default EmptyState