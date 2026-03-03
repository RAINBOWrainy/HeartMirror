/**
 * Utility Functions
 * 工具函数
 */

/**
 * 格式化日期
 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(date)
}

/**
 * 情绪类型中文映射
 */
export const emotionLabels: Record<string, string> = {
  joy: '喜悦',
  sadness: '悲伤',
  anger: '愤怒',
  fear: '恐惧',
  anxiety: '焦虑',
  neutral: '平静',
  surprise: '惊讶',
  disgust: '厌恶',
  loneliness: '孤独',
  frustration: '挫败'
}

/**
 * 情绪颜色映射
 */
export const emotionColors: Record<string, string> = {
  joy: '#gold',
  sadness: '#blue',
  anger: '#red',
  fear: '#purple',
  anxiety: '#orange',
  neutral: '#green',
  surprise: '#cyan'
}

/**
 * 风险等级颜色
 */
export const riskLevelColors: Record<string, string> = {
  green: '#52c41a',
  yellow: '#faad14',
  orange: '#fa8c16',
  red: '#f5222d'
}

/**
 * 风险等级文本
 */
export const riskLevelText: Record<string, string> = {
  green: '良好',
  yellow: '关注',
  orange: '警示',
  red: '高风险'
}

/**
 * 生成随机匿名ID
 */
export function generateAnonymousId(): string {
  const adjectives = ['快乐', '温暖', '阳光', '星空', '晨曦', '清风', '明月', '静心']
  const nouns = ['小鹿', '飞鸟', '流星', '微风', '云朵', '蝴蝶', '浪花', '樱花']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 1000)
  return `${adj}${noun}${num}`
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}