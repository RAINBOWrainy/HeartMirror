/**
 * Local Diary Service
 * 本地日记存储服务 - 使用 IndexedDB
 */

import { indexedDBService, STORES } from './indexedDB'

export interface DiaryItem {
  id: string
  mood: string
  tags: string[]
  content: string
  created_at: string
  updated_at?: string
}

// 生成唯一 ID
const generateId = () => `diary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * 本地日记服务
 */
export const localDiaryService = {
  /**
   * 创建日记
   */
  create: async (data: { content: string; mood?: string; tags?: string[] }): Promise<{ data: DiaryItem }> => {
    const id = generateId()
    const now = new Date().toISOString()
    const diary: DiaryItem = {
      id,
      mood: data.mood || 'neutral',
      tags: data.tags || [],
      content: data.content,
      created_at: now,
    }
    await indexedDBService.setItem(STORES.DIARY, diary)
    return { data: diary }
  },

  /**
   * 获取日记列表
   */
  list: async (params?: { limit?: number; offset?: number }): Promise<{ data: DiaryItem[] }> => {
    const allDiaries = await indexedDBService.getAllItems<DiaryItem>(STORES.DIARY)
    // 按创建时间倒序排列
    const sorted = allDiaries.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const offset = params?.offset || 0
    const limit = params?.limit || 50
    return { data: sorted.slice(offset, offset + limit) }
  },

  /**
   * 获取单个日记
   */
  get: async (diaryId: string): Promise<{ data: DiaryItem | null }> => {
    const diary = await indexedDBService.getItem<DiaryItem>(STORES.DIARY, diaryId)
    return { data: diary }
  },

  /**
   * 更新日记
   */
  update: async (diaryId: string, data: { content?: string; mood?: string; tags?: string[] }): Promise<{ data: DiaryItem | null }> => {
    const existing = await indexedDBService.getItem<DiaryItem>(STORES.DIARY, diaryId)
    if (!existing) {
      return { data: null }
    }
    const updated: DiaryItem = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    }
    await indexedDBService.setItem(STORES.DIARY, updated)
    return { data: updated }
  },

  /**
   * 删除日记
   */
  delete: async (diaryId: string): Promise<{ success: boolean }> => {
    await indexedDBService.deleteItem(STORES.DIARY, diaryId)
    return { success: true }
  },

  /**
   * 获取日记统计
   */
  getStats: async (): Promise<{ total: number; moodCounts: Record<string, number> }> => {
    const allDiaries = await indexedDBService.getAllItems<DiaryItem>(STORES.DIARY)
    const moodCounts: Record<string, number> = {}
    for (const diary of allDiaries) {
      moodCounts[diary.mood] = (moodCounts[diary.mood] || 0) + 1
    }
    return { total: allDiaries.length, moodCounts }
  },
}

export default localDiaryService