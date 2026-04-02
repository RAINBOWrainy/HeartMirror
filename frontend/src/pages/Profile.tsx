/**
 * Profile Page
 * 用户档案页面 - 显示用户统计信息和设置 - 使用 Tailwind + shadcn/ui
 */

import { useState } from 'react'
import {
  User,
  MessageSquare,
  Book,
  Zap,
  Trophy,
  Calendar,
  Download,
  Trash2,
  Shield,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Bell,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { exportService } from '@/services/export'
import { indexedDBService } from '@/services/indexedDB'
import NotificationSettings from '@/components/Notification/NotificationSettings'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  Badge,
  Progress,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Alert,
} from '@/components/ui'
import { cn } from '@/lib/utils'

/**
 * 用户档案页面
 * 显示用户信息、使用统计和操作选项
 */
const Profile = () => {
  const { user } = useAuthStore()
  const { sessions } = useChatStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // 计算统计数据
  const totalSessions = sessions.length
  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0)

  // 计算连续使用天数（简化版本）
  const getStreakDays = () => {
    if (sessions.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dates = new Set<string>()
    sessions.forEach(s => {
      const date = new Date(s.createdAt)
      date.setHours(0, 0, 0, 0)
      dates.add(date.toISOString().split('T')[0])
    })

    let streak = 0
    let checkDate = new Date(today)

    while (dates.has(checkDate.toISOString().split('T')[0])) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    return streak
  }

  const streakDays = getStreakDays()

  // 导出操作
  const handleExportJSON = () => {
    exportService.exportJSON()
    // TODO: toast
    alert('JSON 数据已导出')
  }

  const handleExportCSV = () => {
    exportService.exportCSV()
    alert('CSV 数据已导出')
  }

  const handleExportStats = () => {
    exportService.exportStatsCSV()
    alert('统计数据已导出')
  }

  // 清除所有数据
  const handleClearAllData = async () => {
    try {
      // 删除 IndexedDB 数据库
      await indexedDBService.deleteDatabase()
      alert('所有数据已清除')

      // 清除 stores 状态
      useChatStore.getState().clearAll()
      useAuthStore.getState().logout()

      // 刷新页面重新初始化
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('清除数据失败:', error)
      alert('清除数据失败，请重试')
    }
  }

  // 获取风险等级显示
  const getRiskLevelBadge = () => {
    const level = user?.risk_level || 'GREEN'
    const config: Record<string, { variant: 'success' | 'warning' | 'error' | 'default'; text: string }> = {
      GREEN: { variant: 'success', text: '良好' },
      YELLOW: { variant: 'warning', text: '关注' },
      ORANGE: { variant: 'warning', text: '注意' },
      RED: { variant: 'error', text: '关怀' },
    }
    const { variant, text } = config[level] || config.GREEN
    return <Badge variant={variant}>{text}</Badge>
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* 用户信息卡片 */}
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <Avatar
            size="lg"
            className="bg-primary text-white"
          >
            <User className="w-8 h-8" />
          </Avatar>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-semibold text-foreground m-0">
              {user?.nickname || '心镜用户'}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-muted-foreground text-sm">
                ID: {user?.anonymous_id || '本地用户'}
              </span>
              {getRiskLevelBadge()}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                加入时间: {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('zh-CN')
                  : '今天'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 使用统计 */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          使用统计
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-semibold text-foreground m-0">{totalSessions}</p>
            <p className="text-sm text-muted-foreground m-0 mt-1">对话次数</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-semibold text-foreground m-0">{totalMessages}</p>
            <p className="text-sm text-muted-foreground m-0 mt-1">消息总数</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            <p className="text-2xl font-semibold text-foreground m-0">{streakDays}</p>
            <p className="text-sm text-muted-foreground m-0 mt-1">连续打卡</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-semibold text-foreground m-0">100%</p>
            <p className="text-sm text-muted-foreground m-0 mt-1">心理健康</p>
          </Card>
        </div>
      </div>

      {/* 进度展示 */}
      <Card className="p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg">使用进度</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div>
            <p className="text-foreground mb-2">对话活跃度</p>
            <Progress value={Math.min(100, totalSessions * 10)} variant="primary" />
            <p className="text-sm text-muted-foreground mt-2">
              {totalSessions < 10 ? `再进行 ${10 - totalSessions} 次对话解锁下一等级` : '已达到最高等级'}
            </p>
          </div>
          <div>
            <p className="text-foreground mb-2">连续打卡</p>
            <Progress value={Math.min(100, streakDays * 14.3)} variant="warning" />
            <p className="text-sm text-muted-foreground mt-2">
              {streakDays < 7 ? `坚持 ${7 - streakDays} 天解锁成就` : '本周打卡完成'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 通知设置 */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          通知提醒
        </h3>
        <NotificationSettings />
      </div>

      {/* 数据操作 */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          数据管理
        </h3>
        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              您的所有数据都加密存储在本地设备上，完全由您掌控。您可以随时导出或删除数据。
            </p>

            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    导出数据
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <FileText className="w-4 h-4 mr-2" />
                    导出 JSON（完整数据）
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    导出 CSV（消息列表）
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportStats}>
                    <Trophy className="w-4 h-4 mr-2" />
                    导出统计 CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清除所有数据
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                数据安全提示：您的数据使用 AES-256 加密存储，密钥仅存在于您的设备上。
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-error" />
              确认清除所有数据？
            </DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-4">
              <p>此操作将永久删除以下数据：</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>所有聊天会话和消息</li>
                <li>所有日记记录</li>
                <li>所有情绪记录</li>
                <li>用户档案和设置</li>
              </ul>
              <Alert variant="error">
                此操作不可恢复，请确保已导出备份！
              </Alert>
            </div>
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleClearAllData}>
              确认清除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Profile