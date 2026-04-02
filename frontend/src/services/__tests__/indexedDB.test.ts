/**
 * IndexedDB Storage Service Tests
 * 测试 IndexedDB 存储服务
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 由于 IndexedDB 在测试环境中被 mock，我们测试 API 调用逻辑

describe('IndexedDB Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('STORES 常量', () => {
    it('应该定义所有需要的存储区', async () => {
      const { STORES } = await import('../indexedDB')

      expect(STORES).toHaveProperty('CHAT_SESSIONS')
      expect(STORES).toHaveProperty('CHAT_MESSAGES')
      expect(STORES).toHaveProperty('AUTH')
      expect(STORES).toHaveProperty('AI_SETTINGS')
      expect(STORES).toHaveProperty('DIARY')
      expect(STORES).toHaveProperty('EMOTION_RECORDS')
      expect(STORES).toHaveProperty('USER_PROFILE')
    })

    it('存储区名称应该是字符串', async () => {
      const { STORES } = await import('../indexedDB')

      Object.values(STORES).forEach(storeName => {
        expect(typeof storeName).toBe('string')
      })
    })
  })

  describe('initDB 函数', () => {
    it('应该返回 Promise', async () => {
      const { initDB } = await import('../indexedDB')

      const result = initDB()
      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('导出的服务对象', () => {
    it('应该导出所有必要的函数', async () => {
      const { indexedDBService } = await import('../indexedDB')

      expect(indexedDBService).toHaveProperty('init')
      expect(indexedDBService).toHaveProperty('get')
      expect(indexedDBService).toHaveProperty('setItem')
      expect(indexedDBService).toHaveProperty('getItem')
      expect(indexedDBService).toHaveProperty('getAllItems')
      expect(indexedDBService).toHaveProperty('deleteItem')
      expect(indexedDBService).toHaveProperty('clearStore')
      expect(indexedDBService).toHaveProperty('getByIndex')
      expect(indexedDBService).toHaveProperty('bulkSetItems')
      expect(indexedDBService).toHaveProperty('isInitialized')
      expect(indexedDBService).toHaveProperty('close')
      expect(indexedDBService).toHaveProperty('deleteDatabase')
    })
  })
})

describe('Zustand IndexedDB Storage Adapter', () => {
  describe('createIndexedDBStorage', () => {
    it('应该创建包含必要方法的对象', async () => {
      const { createIndexedDBStorage } = await import('../zustandIndexedDBStorage')
      const { STORES } = await import('../indexedDB')

      const storage = createIndexedDBStorage(STORES.CHAT_SESSIONS, 'test-key')

      expect(storage).toHaveProperty('getItem')
      expect(storage).toHaveProperty('setItem')
      expect(storage).toHaveProperty('removeItem')
      expect(typeof storage.getItem).toBe('function')
      expect(typeof storage.setItem).toBe('function')
      expect(typeof storage.removeItem).toBe('function')
    })
  })

  describe('预定义存储适配器', () => {
    it('应该导出所有预定义的存储适配器', async () => {
      const mod = await import('../zustandIndexedDBStorage')

      // 所有适配器都应该有相同的方法结构
      const adapters = [
        mod.chatStorage,
        mod.authStorage,
        mod.aiSettingsStorage,
        mod.userProfileStorage,
      ]

      adapters.forEach(storage => {
        expect(storage).toHaveProperty('getItem')
        expect(storage).toHaveProperty('setItem')
        expect(storage).toHaveProperty('removeItem')
      })
    })
  })
})