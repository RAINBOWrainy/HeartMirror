/**
 * Notification Service Tests
 * 测试通知服务函数
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isInQuietHours,
  shouldSendNotification,
  getNotificationIcon,
  getNotificationTypeLabel,
} from '../notification'
import type { NotificationConfig } from '../../stores/notificationStore'

describe('Notification Service', () => {
  describe('isInQuietHours', () => {
    it('should return false when quiet hours are not set', () => {
      expect(isInQuietHours(undefined, undefined)).toBe(false)
      expect(isInQuietHours('22:00', undefined)).toBe(false)
      expect(isInQuietHours(undefined, '08:00')).toBe(false)
    })

    it('should correctly detect quiet hours during the day', () => {
      // Mock current time to be 14:00
      const mockDate = new Date('2024-01-01T14:00:00')
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)

      // Quiet hours: 13:00 - 15:00
      expect(isInQuietHours('13:00', '15:00')).toBe(true)

      // Quiet hours: 16:00 - 18:00
      expect(isInQuietHours('16:00', '18:00')).toBe(false)

      vi.useRealTimers()
    })

    it('should handle overnight quiet hours', () => {
      // Mock current time to be 23:00
      let mockDate = new Date('2024-01-01T23:00:00')
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)

      // Quiet hours: 22:00 - 08:00 (overnight)
      expect(isInQuietHours('22:00', '08:00')).toBe(true)

      // Mock current time to be 03:00
      mockDate = new Date('2024-01-01T03:00:00')
      vi.setSystemTime(mockDate)

      expect(isInQuietHours('22:00', '08:00')).toBe(true)

      // Mock current time to be 12:00
      mockDate = new Date('2024-01-01T12:00:00')
      vi.setSystemTime(mockDate)

      expect(isInQuietHours('22:00', '08:00')).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('shouldSendNotification', () => {
    const createMockNotification = (
      overrides: Partial<NotificationConfig> = {}
    ): NotificationConfig => ({
      id: 'test-id',
      type: 'diary_reminder',
      title: 'Test',
      body: 'Test body',
      scheduledTime: new Date().toISOString(),
      enabled: true,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...overrides,
    })

    it('should return false for disabled notification', () => {
      const notification = createMockNotification({ enabled: false })
      expect(shouldSendNotification(notification, undefined, undefined)).toBe(false)
    })

    it('should return false for dismissed notification', () => {
      const notification = createMockNotification({ status: 'dismissed' })
      expect(shouldSendNotification(notification, undefined, undefined)).toBe(false)
    })

    it('should return false during quiet hours', () => {
      const notification = createMockNotification()

      // Mock current time to be 23:00
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T23:00:00'))

      expect(shouldSendNotification(notification, '22:00', '08:00')).toBe(false)

      vi.useRealTimers()
    })

    it('should return false if already sent today for daily notification', () => {
      const notification = createMockNotification({
        repeat: 'daily',
        scheduledTime: new Date('2024-01-01T23:00:00').toISOString(),
        lastSentAt: new Date('2024-01-01T23:00:00').toISOString(),
      })

      // Mock current time to be same day
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T23:01:00'))

      expect(shouldSendNotification(notification, undefined, undefined)).toBe(false)

      vi.useRealTimers()
    })

    it('should return true for valid daily notification', () => {
      const scheduledTime = new Date()
      scheduledTime.setHours(14, 0, 0, 0)

      const notification = createMockNotification({
        repeat: 'daily',
        scheduledTime: scheduledTime.toISOString(),
      })

      // Mock current time to match scheduled time
      vi.useFakeTimers()
      vi.setSystemTime(new Date(scheduledTime.getTime() + 30000)) // 30 seconds later

      expect(shouldSendNotification(notification, undefined, undefined)).toBe(true)

      vi.useRealTimers()
    })
  })

  describe('Helper functions', () => {
    it('should return correct notification icon', () => {
      expect(getNotificationIcon('diary_reminder')).toBe('📝')
      expect(getNotificationIcon('exercise_reminder')).toBe('🧘')
      expect(getNotificationIcon('check_in')).toBe('✅')
      expect(getNotificationIcon('custom')).toBe('🔔')
      expect(getNotificationIcon('unknown')).toBe('🔔')
    })

    it('should return correct notification type label', () => {
      expect(getNotificationTypeLabel('diary_reminder')).toBe('日记提醒')
      expect(getNotificationTypeLabel('exercise_reminder')).toBe('放松练习')
      expect(getNotificationTypeLabel('check_in')).toBe('签到提醒')
      expect(getNotificationTypeLabel('custom')).toBe('自定义')
      expect(getNotificationTypeLabel('unknown')).toBe('通知')
    })
  })
})