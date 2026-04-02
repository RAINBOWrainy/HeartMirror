/**
 * NotificationSettings Component
 * 通知设置组件 - 管理提醒通知 - 使用 Tailwind + shadcn/ui
 */

import React, { useEffect, useState } from 'react'
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  Pencil,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import type { NotificationConfig, NotificationType, PermissionStatus } from '@/stores/notificationStore'
import { useNotificationStore } from '@/stores/notificationStore'
import {
  startNotificationChecker,
  stopNotificationChecker,
  getNotificationTypeLabel,
  getNotificationIcon,
} from '@/services/notification'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
  Alert,
} from '@/components/ui'
import { cn } from '@/lib/utils'

// 通知类型选项
const notificationTypeOptions: { value: NotificationType; label: string; icon: string }[] = [
  { value: 'diary_reminder', label: '日记提醒', icon: '📝' },
  { value: 'exercise_reminder', label: '放松练习', icon: '🧘' },
  { value: 'check_in', label: '签到提醒', icon: '✅' },
  { value: 'custom', label: '自定义', icon: '🔔' },
]

// 重复模式选项
const repeatOptions = [
  { value: 'none', label: '不重复' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
]

// 周几选项
const weekDayOptions = [
  { value: '0', label: '周日' },
  { value: '1', label: '周一' },
  { value: '2', label: '周二' },
  { value: '3', label: '周三' },
  { value: '4', label: '周四' },
  { value: '5', label: '周五' },
  { value: '6', label: '周六' },
]

// 简单的 Switch 组件
const Switch: React.FC<{
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      checked ? 'bg-primary' : 'bg-muted',
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    )}
  >
    <span
      className={cn(
        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        checked ? 'translate-x-5' : 'translate-x-0'
      )}
    />
  </button>
)

const NotificationSettings: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<NotificationConfig | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<NotificationConfig | null>(null)

  // 表单状态
  const [formType, setFormType] = useState<NotificationType>('diary_reminder')
  const [formTitle, setFormTitle] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formTime, setFormTime] = useState('20:00')
  const [formRepeat, setFormRepeat] = useState<'none' | 'daily' | 'weekly'>('daily')
  const [formRepeatDays, setFormRepeatDays] = useState<string[]>([])

  const {
    notifications,
    permissionStatus,
    notificationsEnabled,
    quietHoursStart,
    quietHoursEnd,
    addNotification,
    updateNotification,
    removeNotification,
    enableNotification,
    disableNotification,
    requestPermission,
    setNotificationsEnabled,
    setQuietHours,
  } = useNotificationStore()

  // 启动通知检查器
  useEffect(() => {
    if (notificationsEnabled && permissionStatus === 'granted') {
      startNotificationChecker()
    } else {
      stopNotificationChecker()
    }

    return () => stopNotificationChecker()
  }, [notificationsEnabled, permissionStatus])

  // 处理全局开关变化
  const handleGlobalToggle = async (checked: boolean) => {
    if (checked && permissionStatus !== 'granted') {
      // 请求权限
      const status = await requestPermission()
      if (status !== 'granted') {
        alert('通知权限被拒绝，请在浏览器设置中允许通知')
        return
      }
    }
    setNotificationsEnabled(checked)
    if (checked) {
      alert('通知已启用')
    } else {
      alert('通知已禁用')
    }
  }

  // 处理单个通知开关
  const handleNotificationToggle = (id: string, checked: boolean) => {
    if (checked) {
      enableNotification(id)
    } else {
      disableNotification(id)
    }
  }

  // 打开添加/编辑模态框
  const openModal = (notification?: NotificationConfig) => {
    setEditingNotification(notification || null)
    if (notification) {
      setFormType(notification.type)
      setFormTitle(notification.title)
      setFormBody(notification.body || '')
      const time = new Date(notification.scheduledTime)
      setFormTime(`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`)
      setFormRepeat(notification.repeat || 'none')
      setFormRepeatDays(notification.repeatDays?.map(d => d.toString()) || [])
    } else {
      setFormType('diary_reminder')
      setFormTitle('')
      setFormBody('')
      setFormTime('20:00')
      setFormRepeat('daily')
      setFormRepeatDays([])
    }
    setIsModalOpen(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formTitle.trim() || !formBody.trim() || !formTime) {
      alert('请填写完整信息')
      return
    }

    const [hours, minutes] = formTime.split(':').map(Number)
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)

    if (editingNotification) {
      updateNotification(editingNotification.id, {
        type: formType,
        title: formTitle,
        body: formBody,
        scheduledTime,
        repeat: formRepeat,
        repeatDays: formRepeat === 'weekly' ? formRepeatDays.map(Number) : undefined,
      })
      alert('通知已更新')
    } else {
      addNotification({
        type: formType,
        title: formTitle,
        body: formBody,
        scheduledTime,
        repeat: formRepeat,
        repeatDays: formRepeat === 'weekly' ? formRepeatDays.map(Number) : undefined,
        enabled: true,
      })
      alert('通知已添加')
    }

    setIsModalOpen(false)
  }

  // 删除通知
  const handleDelete = () => {
    if (notificationToDelete) {
      removeNotification(notificationToDelete.id)
      alert('通知已删除')
      setDeleteDialogOpen(false)
      setNotificationToDelete(null)
    }
  }

  // 处理静默时段变化
  const handleQuietHoursChange = (start: string | undefined, end: string | undefined) => {
    setQuietHours(start, end)
    if (start && end) {
      alert(`静默时段已设置为 ${start} - ${end}`)
    } else {
      alert('静默时段已关闭')
    }
  }

  // 获取权限状态标签
  const getPermissionBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />已授权</Badge>
      case 'denied':
        return <Badge variant="error" className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />已拒绝</Badge>
      default:
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />待授权</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          通知提醒
        </CardTitle>
        <div className="flex items-center gap-3">
          {getPermissionBadge()}
          <Switch
            checked={notificationsEnabled}
            onChange={handleGlobalToggle}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 权限说明 */}
        {permissionStatus !== 'granted' && (
          <p className="text-muted-foreground">
            通知功能需要浏览器授权。点击开关按钮请求权限。
          </p>
        )}

        {/* 静默时段设置 */}
        <div>
          <Label>静默时段</Label>
          <p className="text-sm text-muted-foreground mt-1">
            在此时间段内不发送通知
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Input
              type="time"
              value={quietHoursStart || ''}
              onChange={(e) => handleQuietHoursChange(e.target.value, quietHoursEnd)}
              placeholder="开始时间"
              className="w-24"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="time"
              value={quietHoursEnd || ''}
              onChange={(e) => handleQuietHoursChange(quietHoursStart, e.target.value)}
              placeholder="结束时间"
              className="w-24"
            />
            {(quietHoursStart || quietHoursEnd) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuietHoursChange(undefined, undefined)}
              >
                清除
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          {/* 通知列表 */}
          <div className="flex items-center justify-between mb-4">
            <Label>提醒列表</Label>
            <Button
              size="sm"
              onClick={() => openModal()}
            >
              <Plus className="w-4 h-4 mr-2" />
              添加提醒
            </Button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">暂无提醒</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification: NotificationConfig) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{notification.title}</span>
                        <Badge variant="secondary">{getNotificationTypeLabel(notification.type)}</Badge>
                        {notification.repeat !== 'none' && (
                          <Badge variant="primary">
                            {notification.repeat === 'daily' ? '每天' : `每周${notification.repeatDays?.map((d: number) => weekDayOptions.find(o => o.value === d.toString())?.label).join(', ')}`}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{notification.body}</span>
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(notification.scheduledTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={notification.enabled}
                      onChange={(checked) => handleNotificationToggle(notification.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(notification)}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNotificationToDelete(notification)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 添加/编辑通知模态框 */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingNotification ? '编辑提醒' : '添加提醒'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>类型</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as NotificationType)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>标题</Label>
                <Input
                  className="mt-2"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="通知标题"
                />
              </div>
              <div>
                <Label>内容</Label>
                <Input
                  className="mt-2"
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="通知内容"
                />
              </div>
              <div>
                <Label>发送时间</Label>
                <Input
                  type="time"
                  className="mt-2"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
              <div>
                <Label>重复模式</Label>
                <Select value={formRepeat} onValueChange={(v) => setFormRepeat(v as 'none' | 'daily' | 'weekly')}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {repeatOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formRepeat === 'weekly' && (
                <div>
                  <Label>重复日期</Label>
                  <Select value={formRepeatDays[0] || ''} onValueChange={(v) => setFormRepeatDays([v])}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="选择日期" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDayOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button onClick={handleSubmit}>{editingNotification ? '保存' : '添加'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">确定要删除这个通知吗？</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
              <Button variant="destructive" onClick={handleDelete}>删除</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default NotificationSettings