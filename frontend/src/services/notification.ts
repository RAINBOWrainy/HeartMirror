/**
 * Notification Service
 * 通知服务 - 处理定时提醒和浏览器通知发送
 *
 * 功能：
 * - 检查待发送通知
 * - 发送浏览器通知
 * - 处理静默时段
 * - 定时检查循环通知
 */

import { useNotificationStore, type NotificationConfig, type PermissionStatus } from '../stores/notificationStore'

// 检查是否在静默时段
export const isInQuietHours = (
  quietHoursStart: string | undefined,
  quietHoursEnd: string | undefined
): boolean => {
  if (!quietHoursStart || !quietHoursEnd) return false

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const [startHour, startMin] = quietHoursStart.split(':').map(Number)
  const [endHour, endMin] = quietHoursEnd.split(':').map(Number)

  const startTime = startHour * 60 + startMin
  const endTime = endHour * 60 + endMin

  // 处理跨夜静默时段（如22:00-08:00）
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime
  }

  return currentTime >= startTime && currentTime <= endTime
}

// 检查通知是否应该发送
export const shouldSendNotification = (
  notification: NotificationConfig,
  quietHoursStart: string | undefined,
  quietHoursEnd: string | undefined
): boolean => {
  // 检查通知是否启用
  if (!notification.enabled) return false

  // 检查状态
  if (notification.status === 'dismissed') return false

  // 检查静默时段
  if (isInQuietHours(quietHoursStart, quietHoursEnd)) return false

  // 检查定时时间
  const scheduledTime = new Date(notification.scheduledTime)
  const now = new Date()

  // 如果是循环通知，检查是否在今天应该发送
  if (notification.repeat === 'daily') {
    // 每天发送，检查时间是否匹配（允许1分钟误差）
    const scheduledHour = scheduledTime.getHours()
    const scheduledMin = scheduledTime.getMinutes()
    const currentHour = now.getHours()
    const currentMin = now.getMinutes()

    // 检查是否已经发送过今天
    if (notification.lastSentAt) {
      const lastSent = new Date(notification.lastSentAt)
      if (lastSent.toDateString() === now.toDateString()) {
        return false
      }
    }

    return scheduledHour === currentHour && Math.abs(scheduledMin - currentMin) <= 1
  }

  if (notification.repeat === 'weekly' && notification.repeatDays) {
    const currentDay = now.getDay()
    if (!notification.repeatDays.includes(currentDay)) {
      return false
    }

    // 检查是否已经发送过今天
    if (notification.lastSentAt) {
      const lastSent = new Date(notification.lastSentAt)
      if (lastSent.toDateString() === now.toDateString()) {
        return false
      }
    }

    const scheduledHour = scheduledTime.getHours()
    const scheduledMin = scheduledTime.getMinutes()
    const currentHour = now.getHours()
    const currentMin = now.getMinutes()

    return scheduledHour === currentHour && Math.abs(scheduledMin - currentMin) <= 1
  }

  // 非循环通知，检查是否到达预定时间
  return now >= scheduledTime
}

// 发送浏览器通知
export const sendBrowserNotification = async (
  title: string,
  body: string,
  options?: NotificationOptions
): Promise<boolean> => {
  // 检查浏览器支持
  if (!('Notification' in window)) {
    console.warn('浏览器不支持通知功能')
    return false
  }

  // 检查权限
  const permission = Notification.permission as PermissionStatus
  if (permission !== 'granted') {
    console.warn('通知权限未授权')
    return false
  }

  try {
    // 创建通知
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false,
      ...options
    })

    // 处理点击事件
    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    return true
  } catch (error) {
    console.error('发送通知失败', error)
    return false
  }
}

// 处理所有待发送通知
export const processPendingNotifications = async (): Promise<void> => {
  const state = useNotificationStore.getState()

  // 检查全局开关
  if (!state.notificationsEnabled) return

  // 检查权限
  if (state.permissionStatus !== 'granted') return

  // 检查每个通知
  for (const notification of state.notifications) {
    if (shouldSendNotification(
      notification,
      state.quietHoursStart,
      state.quietHoursEnd
    )) {
      // 发送通知
      const sent = await sendBrowserNotification(
        notification.title,
        notification.body
      )

      if (sent) {
        // 标记已发送
        state.markAsSent(notification.id)

        // 对于循环通知，重置状态以便下次发送
        if (notification.repeat === 'daily' || notification.repeat === 'weekly') {
          setTimeout(() => {
            state.updateNotification(notification.id, { status: 'pending' })
          }, 60000) // 1分钟后重置
        }
      }
    }
  }
}

// 启动定时检查（每分钟检查一次）
let checkInterval: ReturnType<typeof setInterval> | null = null

export const startNotificationChecker = (): void => {
  // 防止重复启动
  if (checkInterval) return

  // 立即检查一次
  processPendingNotifications()

  // 每分钟检查一次
  checkInterval = setInterval(processPendingNotifications, 60000)
}

export const stopNotificationChecker = (): void => {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

// 获取通知类型的图标
export const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'diary_reminder':
      return '📝'
    case 'exercise_reminder':
      return '🧘'
    case 'check_in':
      return '✅'
    case 'custom':
      return '🔔'
    default:
      return '🔔'
  }
}

// 获取通知类型的标签
export const getNotificationTypeLabel = (type: string): string => {
  switch (type) {
    case 'diary_reminder':
      return '日记提醒'
    case 'exercise_reminder':
      return '放松练习'
    case 'check_in':
      return '签到提醒'
    case 'custom':
      return '自定义'
    default:
      return '通知'
  }
}