/**
 * Notification Store
 * 通知/提醒状态管理
 *
 * 支持定时提醒功能：写日记提醒、放松练习提醒等
 * 使用浏览器 Notification API 显示桌面通知
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createIndexedDBStorage } from '../services/zustandIndexedDBStorage'

// 通知类型
export type NotificationType = 'diary_reminder' | 'exercise_reminder' | 'check_in' | 'custom'

// 通知状态
export type NotificationStatus = 'pending' | 'sent' | 'dismissed'

// 单个通知配置
export interface NotificationConfig {
  id: string
  type: NotificationType
  title: string
  body: string
  scheduledTime: Date | string // 定时发送时间
  repeat?: 'daily' | 'weekly' | 'none' // 重复模式
  repeatDays?: number[] // 每周重复的日期 (0-6, 0=周日)
  enabled: boolean
  status: NotificationStatus
  createdAt: Date | string
  lastSentAt?: Date | string
}

// 通知权限状态
export type PermissionStatus = 'granted' | 'denied' | 'default'

interface NotificationState {
  // 通知列表
  notifications: NotificationConfig[]
  // 权限状态
  permissionStatus: PermissionStatus
  // 是否启用通知功能
  notificationsEnabled: boolean
  // 静默时段（不发送通知）
  quietHoursStart?: string // HH:mm格式
  quietHoursEnd?: string // HH:mm格式
  // 操作
  addNotification: (notification: Omit<NotificationConfig, 'id' | 'status' | 'createdAt'>) => string
  updateNotification: (id: string, updates: Partial<NotificationConfig>) => void
  removeNotification: (id: string) => void
  enableNotification: (id: string) => void
  disableNotification: (id: string) => void
  markAsSent: (id: string) => void
  markAsDismissed: (id: string) => void
  // 权限管理
  requestPermission: () => Promise<PermissionStatus>
  setPermissionStatus: (status: PermissionStatus) => void
  // 全局设置
  setNotificationsEnabled: (enabled: boolean) => void
  setQuietHours: (start?: string, end?: string) => void
  // 清理
  clearAll: () => void
  clearSent: () => void
}

// 默认通知配置
const DEFAULT_NOTIFICATIONS: NotificationConfig[] = [
  {
    id: 'default-diary',
    type: 'diary_reminder',
    title: '写日记提醒',
    body: '别忘了记录今天的心情，写日记可以帮助你更好地了解自己。',
    scheduledTime: new Date().toISOString(),
    repeat: 'daily',
    enabled: true,
    status: 'pending',
    createdAt: new Date().toISOString()
  },
  {
    id: 'default-exercise',
    type: 'exercise_reminder',
    title: '放松练习提醒',
    body: '花几分钟做一下放松练习，缓解压力，放松身心。',
    scheduledTime: new Date().toISOString(),
    repeat: 'daily',
    enabled: true,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
]

// IndexedDB存储适配器
const notificationStorage = createIndexedDBStorage('userProfile', 'heartmirror-notifications')

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: DEFAULT_NOTIFICATIONS,
      permissionStatus: 'default',
      notificationsEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',

      // 添加通知
      addNotification: (notification) => {
        const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newNotification: NotificationConfig = {
          ...notification,
          id,
          status: 'pending',
          createdAt: new Date().toISOString(),
          scheduledTime: notification.scheduledTime instanceof Date
            ? notification.scheduledTime.toISOString()
            : notification.scheduledTime
        }
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }))
        return id
      },

      // 更新通知
      updateNotification: (id, updates) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          )
        })),

      // 移除通知
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        })),

      // 启用/禁用通知
      enableNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, enabled: true } : n
          )
        })),

      disableNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, enabled: false } : n
          )
        })),

      // 标记已发送
      markAsSent: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, status: 'sent', lastSentAt: new Date().toISOString() } : n
          )
        })),

      // 标记已忽略
      markAsDismissed: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, status: 'dismissed' } : n
          )
        })),

      // 请求权限
      requestPermission: async () => {
        if (!('Notification' in window)) {
          console.warn('浏览器不支持通知功能')
          return 'denied'
        }

        try {
          const permission = await Notification.requestPermission()
          const status = permission as PermissionStatus
          set({ permissionStatus: status })
          return status
        } catch (error) {
          console.error('请求通知权限失败', error)
          return 'denied'
        }
      },

      // 设置权限状态
      setPermissionStatus: (status) => set({ permissionStatus: status }),

      // 全局设置
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setQuietHours: (start, end) => set({
        quietHoursStart: start,
        quietHoursEnd: end
      }),

      // 清理
      clearAll: () => set({ notifications: [] }),

      clearSent: () =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.status !== 'sent')
        }))
    }),
    {
      name: 'heartmirror-notifications',
      storage: createJSONStorage(() => notificationStorage)
    }
  )
)