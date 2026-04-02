/**
 * Notification Store Tests
 * 测试通知状态管理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotificationStore, type NotificationConfig } from '../notificationStore'

// Mock IndexedDB storage
vi.mock('../../services/zustandIndexedDBStorage', () => ({
  createIndexedDBStorage: vi.fn(() => ({
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  })),
}))

describe('NotificationStore', () => {
  beforeEach(() => {
    // 重置store状态
    useNotificationStore.setState({
      notifications: [],
      permissionStatus: 'default',
      notificationsEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    })
  })

  describe('Notification management', () => {
    it('should add a notification', () => {
      const { addNotification, notifications } = useNotificationStore.getState()

      const id = addNotification({
        type: 'diary_reminder',
        title: '日记提醒',
        body: '别忘了写日记',
        scheduledTime: new Date(),
        enabled: true,
      })

      expect(id).toBeDefined()
      const updated = useNotificationStore.getState().notifications
      expect(updated.length).toBe(1)
      expect(updated[0].title).toBe('日记提醒')
      expect(updated[0].status).toBe('pending')
    })

    it('should update a notification', () => {
      const { addNotification, updateNotification } = useNotificationStore.getState()

      const id = addNotification({
        type: 'diary_reminder',
        title: '日记提醒',
        body: '别忘了写日记',
        scheduledTime: new Date(),
        enabled: true,
      })

      updateNotification(id, { title: '更新后的标题' })

      const updated = useNotificationStore.getState().notifications
      expect(updated[0].title).toBe('更新后的标题')
    })

    it('should remove a notification', () => {
      const { addNotification, removeNotification } = useNotificationStore.getState()

      const id = addNotification({
        type: 'diary_reminder',
        title: '日记提醒',
        body: '别忘了写日记',
        scheduledTime: new Date(),
        enabled: true,
      })

      removeNotification(id)

      const updated = useNotificationStore.getState().notifications
      expect(updated.length).toBe(0)
    })

    it('should enable/disable notification', () => {
      const { addNotification, enableNotification, disableNotification } = useNotificationStore.getState()

      const id = addNotification({
        type: 'diary_reminder',
        title: '日记提醒',
        body: '别忘了写日记',
        scheduledTime: new Date(),
        enabled: true,
      })

      disableNotification(id)
      expect(useNotificationStore.getState().notifications[0].enabled).toBe(false)

      enableNotification(id)
      expect(useNotificationStore.getState().notifications[0].enabled).toBe(true)
    })

    it('should mark notification as sent', () => {
      const { addNotification, markAsSent } = useNotificationStore.getState()

      const id = addNotification({
        type: 'diary_reminder',
        title: '日记提醒',
        body: '别忘了写日记',
        scheduledTime: new Date(),
        enabled: true,
      })

      markAsSent(id)

      const updated = useNotificationStore.getState().notifications
      expect(updated[0].status).toBe('sent')
      expect(updated[0].lastSentAt).toBeDefined()
    })

    it('should mark notification as dismissed', () => {
      const { addNotification, markAsDismissed } = useNotificationStore.getState()

      const id = addNotification({
        type: 'diary_reminder',
        title: '日记提醒',
        body: '别忘了写日记',
        scheduledTime: new Date(),
        enabled: true,
      })

      markAsDismissed(id)

      const updated = useNotificationStore.getState().notifications
      expect(updated[0].status).toBe('dismissed')
    })
  })

  describe('Global settings', () => {
    it('should set notifications enabled', () => {
      const { setNotificationsEnabled } = useNotificationStore.getState()

      setNotificationsEnabled(false)
      expect(useNotificationStore.getState().notificationsEnabled).toBe(false)

      setNotificationsEnabled(true)
      expect(useNotificationStore.getState().notificationsEnabled).toBe(true)
    })

    it('should set quiet hours', () => {
      const { setQuietHours } = useNotificationStore.getState()

      setQuietHours('23:00', '07:00')

      const state = useNotificationStore.getState()
      expect(state.quietHoursStart).toBe('23:00')
      expect(state.quietHoursEnd).toBe('07:00')
    })

    it('should clear quiet hours', () => {
      const { setQuietHours } = useNotificationStore.getState()

      setQuietHours('23:00', '07:00')
      setQuietHours(undefined, undefined)

      const state = useNotificationStore.getState()
      expect(state.quietHoursStart).toBeUndefined()
      expect(state.quietHoursEnd).toBeUndefined()
    })
  })

  describe('Clear operations', () => {
    it('should clear all notifications', () => {
      const { addNotification, clearAll } = useNotificationStore.getState()

      addNotification({
        type: 'diary_reminder',
        title: '提醒1',
        body: '内容1',
        scheduledTime: new Date(),
        enabled: true,
      })
      addNotification({
        type: 'exercise_reminder',
        title: '提醒2',
        body: '内容2',
        scheduledTime: new Date(),
        enabled: true,
      })

      clearAll()

      expect(useNotificationStore.getState().notifications.length).toBe(0)
    })

    it('should clear sent notifications', () => {
      const { addNotification, markAsSent, clearSent } = useNotificationStore.getState()

      const id1 = addNotification({
        type: 'diary_reminder',
        title: '提醒1',
        body: '内容1',
        scheduledTime: new Date(),
        enabled: true,
      })
      const id2 = addNotification({
        type: 'exercise_reminder',
        title: '提醒2',
        body: '内容2',
        scheduledTime: new Date(),
        enabled: true,
      })

      markAsSent(id1)

      clearSent()

      const remaining = useNotificationStore.getState().notifications
      expect(remaining.length).toBe(1)
      expect(remaining[0].id).toBe(id2)
    })
  })
})