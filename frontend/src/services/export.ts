/**
 * Data Export Service
 * 数据导出服务 - 支持 JSON 和 CSV 格式
 *
 * 用于用户备份和查看历史数据
 * 符合 GDPR 数据可携带权要求
 */

import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore'

/**
 * 导出数据类型
 */
export interface ExportData {
  user: {
    id: string | number | undefined
    nickname: string | undefined
    anonymous_id: string | undefined
    created_at: string | undefined
  }
  sessions: ExportSession[]
  exportedAt: string
  version: string
}

export interface ExportSession {
  id: string
  title: string | undefined
  createdAt: string
  lastMessageAt: string | undefined
  messageCount: number
  messages: ExportMessage[]
}

export interface ExportMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  emotion?: string
  emotionIntensity?: number
  timestamp: string
}

/**
 * 收集所有需要导出的数据
 */
export function collectExportData(): ExportData {
  const { user } = useAuthStore.getState()
  const { sessions } = useChatStore.getState()

  return {
    user: {
      id: user?.id,
      nickname: user?.nickname,
      anonymous_id: user?.anonymous_id,
      created_at: user?.created_at,
    },
    sessions: sessions.map(s => ({
      id: s.id,
      title: s.title,
      createdAt: new Date(s.createdAt).toISOString(),
      lastMessageAt: s.lastMessageAt ? new Date(s.lastMessageAt).toISOString() : undefined,
      messageCount: s.messages.length,
      messages: s.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        emotion: m.emotion,
        emotionIntensity: m.emotionIntensity,
        timestamp: new Date(m.timestamp).toISOString(),
      })),
    })),
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  }
}

/**
 * 导出为 JSON 格式
 */
export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * 导出为 CSV 格式（消息列表）
 */
export function exportToCSV(data: ExportData): string {
  const headers = [
    '会话ID',
    '会话标题',
    '消息ID',
    '角色',
    '内容',
    '情绪',
    '情绪强度',
    '时间',
  ]

  const rows: string[][] = []

  data.sessions.forEach(session => {
    session.messages.forEach(msg => {
      rows.push([
        session.id,
        session.title || '',
        msg.id,
        msg.role,
        `"${msg.content.replace(/"/g, '""')}"`, // CSV转义
        msg.emotion || '',
        msg.emotionIntensity?.toString() || '',
        msg.timestamp,
      ])
    })
  })

  // BOM for Excel UTF-8 support
  const BOM = '\uFEFF'
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  return BOM + csvContent
}

/**
 * 导出统计数据摘要 CSV
 */
export function exportStatsToCSV(data: ExportData): string {
  const headers = ['会话ID', '标题', '创建时间', '最后消息时间', '消息数量']

  const rows = data.sessions.map(s => [
    s.id,
    s.title || '',
    s.createdAt,
    s.lastMessageAt || '',
    s.messageCount.toString(),
  ])

  const BOM = '\uFEFF'
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  return BOM + csvContent
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 导出服务对象
 */
export const exportService = {
  collectData: collectExportData,
  toJSON: exportToJSON,
  toCSV: exportToCSV,
  toStatsCSV: exportStatsToCSV,
  download: downloadFile,

  /**
   * 快捷导出 JSON
   */
  exportJSON() {
    const data = collectExportData()
    const content = exportToJSON(data)
    const filename = `heartmirror-data-${new Date().toISOString().split('T')[0]}.json`
    downloadFile(content, filename, 'application/json')
  },

  /**
   * 快捷导出 CSV
   */
  exportCSV() {
    const data = collectExportData()
    const content = exportToCSV(data)
    const filename = `heartmirror-messages-${new Date().toISOString().split('T')[0]}.csv`
    downloadFile(content, filename, 'text/csv;charset=utf-8')
  },

  /**
   * 快捷导出统计 CSV
   */
  exportStatsCSV() {
    const data = collectExportData()
    const content = exportStatsToCSV(data)
    const filename = `heartmirror-stats-${new Date().toISOString().split('T')[0]}.csv`
    downloadFile(content, filename, 'text/csv;charset=utf-8')
  },
}

export default exportService