/**
 * Zustand IndexedDB Storage Adapter
 * 让 Zustand persist middleware 使用 IndexedDB 存储
 *
 * 用于替代 localStorage，突破 5MB 限制
 */

import { StateStorage } from 'zustand/middleware'
import { indexedDBService, STORES, StoreName } from './indexedDB'

/**
 * 创建 IndexedDB Storage Adapter
 *
 * @param storeName - IndexedDB 存储区名称
 * @param keyName - 存储的键名 (用于单条记录存储)
 */
export function createIndexedDBStorage(
  storeName: StoreName,
  keyName: string = 'data'
): StateStorage {
  return {
    /**
     * 获取数据
     */
    getItem: async (name: string) => {
      try {
        // 确保数据库已初始化
        await indexedDBService.init()

        // 使用传入的 keyName 作为存储键
        const data = await indexedDBService.getItem<{ key: string; value: string }>(
          storeName,
          keyName
        )

        return data?.value || null
      } catch (error) {
        console.error(`IndexedDB getItem error (${storeName}):`, error)
        return null
      }
    },

    /**
     * 设置数据
     */
    setItem: async (name: string, value: string) => {
      try {
        // 确保数据库已初始化
        await indexedDBService.init()

        await indexedDBService.setItem(storeName, {
          key: keyName,
          value: value,
        })
      } catch (error) {
        console.error(`IndexedDB setItem error (${storeName}):`, error)
      }
    },

    /**
     * 删除数据
     */
    removeItem: async (name: string) => {
      try {
        await indexedDBService.deleteItem(storeName, keyName)
      } catch (error) {
        console.error(`IndexedDB removeItem error (${storeName}):`, error)
      }
    },
  }
}

/**
 * 预定义的存储适配器
 */

// 聊天数据存储适配器
export const chatStorage = createIndexedDBStorage(STORES.CHAT_SESSIONS, 'heartmirror-chat')

// 认证数据存储适配器
export const authStorage = createIndexedDBStorage(STORES.AUTH, 'heartmirror-auth')

// AI设置存储适配器
export const aiSettingsStorage = createIndexedDBStorage(STORES.AI_SETTINGS, 'heartmirror-ai-settings')

// 用户档案存储适配器
export const userProfileStorage = createIndexedDBStorage(STORES.USER_PROFILE, 'heartmirror-user-profile')

export default createIndexedDBStorage