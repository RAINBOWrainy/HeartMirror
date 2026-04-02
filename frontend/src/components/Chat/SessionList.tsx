/**
 * SessionList Component
 * 会话列表组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import { MessageSquare, Trash2, Clock } from 'lucide-react'
import type { ChatSession } from '@/stores/chatStore'
import { Badge, Button, Spinner } from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface SessionListProps {
  sessions: ChatSession[]
  currentSessionId?: string
  loading?: boolean
  onSelect: (session: ChatSession) => void
  onDelete: (sessionId: string) => void
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentSessionId,
  loading = false,
  onSelect,
  onDelete
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [sessionToDelete, setSessionToDelete] = React.useState<ChatSession | null>(null)

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }

  const getStageBadge = (stage: string) => {
    const stageConfig: Record<string, { variant: 'default' | 'primary' | 'warning' | 'error' | 'success'; text: string }> = {
      greeting: { variant: 'default', text: '问候' },
      emotion_assessment: { variant: 'warning', text: '情绪评估' },
      questionnaire: { variant: 'default', text: '问卷' },
      risk_assessment: { variant: 'error', text: '风险评估' },
      intervention: { variant: 'success', text: '干预' },
      closing: { variant: 'default', text: '结束' }
    }
    const config = stageConfig[stage] || { variant: 'default', text: stage }
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const handleDeleteClick = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation()
    setSessionToDelete(session)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDelete(sessionToDelete.id)
    }
    setDeleteDialogOpen(false)
    setSessionToDelete(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Spinner size="lg" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        暂无对话记录
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {sessions.map((session) => {
          const isActive = session.id === currentSessionId
          const messageCount = session.messages?.length || 0

          return (
            <div
              key={session.id}
              onClick={() => onSelect(session)}
              className={cn(
                'p-3 rounded-lg border cursor-pointer transition-all duration-200',
                'hover:shadow-soft hover:-translate-y-0.5',
                isActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {session.title || '新对话'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-error hover:text-error hover:bg-error/10"
                  onClick={(e) => handleDeleteClick(e, session)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-muted-foreground">
                  {messageCount} 条消息
                </span>
                {getStageBadge(session.currentStage)}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(session.lastMessageAt || session.createdAt)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除此对话吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SessionList