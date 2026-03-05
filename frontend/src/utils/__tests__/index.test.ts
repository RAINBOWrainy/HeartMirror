/**
 * Utils Tests
 * 工具函数测试
 */
import { describe, it, expect } from 'vitest'
import { formatDate, formatRelativeTime, emotionLabels, emotionColors, riskLevelColors } from '../../utils'

describe('formatDate', () => {
  it('should format date correctly with default format', () => {
    const date = new Date('2024-03-05T14:30:00')
    expect(formatDate(date)).toBe('2024-03-05')
  })

  it('should format date with custom format', () => {
    const date = new Date('2024-03-05T14:30:00')
    expect(formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2024-03-05 14:30')
  })

  it('should handle string date input', () => {
    expect(formatDate('2024-03-05')).toBe('2024-03-05')
  })
})

describe('formatRelativeTime', () => {
  it('should return "刚刚" for recent time', () => {
    const now = new Date()
    expect(formatRelativeTime(now)).toBe('刚刚')
  })

  it('should return minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60000)
    expect(formatRelativeTime(date)).toBe('5分钟前')
  })

  it('should return hours ago', () => {
    const date = new Date(Date.now() - 2 * 3600000)
    expect(formatRelativeTime(date)).toBe('2小时前')
  })

  it('should return days ago', () => {
    const date = new Date(Date.now() - 3 * 86400000)
    expect(formatRelativeTime(date)).toBe('3天前')
  })
})

describe('emotionLabels', () => {
  it('should have 16 emotion types', () => {
    expect(Object.keys(emotionLabels).length).toBe(16)
  })

  it('should have correct Chinese labels', () => {
    expect(emotionLabels.joy).toBe('喜悦')
    expect(emotionLabels.sadness).toBe('悲伤')
    expect(emotionLabels.anxiety).toBe('焦虑')
    expect(emotionColors.anger).toBe('red')
  })
})

describe('emotionColors', () => {
  it('should have color mapping for all emotions', () => {
    expect(emotionColors.joy).toBeDefined()
    expect(emotionColors.neutral).toBeDefined()
  })
})

describe('riskLevelColors', () => {
  it('should have all risk levels', () => {
    expect(riskLevelColors.green).toBeDefined()
    expect(riskLevelColors.yellow).toBeDefined()
    expect(riskLevelColors.orange).toBeDefined()
    expect(riskLevelColors.red).toBeDefined()
  })
})