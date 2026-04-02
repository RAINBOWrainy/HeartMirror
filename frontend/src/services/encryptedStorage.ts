/**
 * Encrypted IndexedDB Storage Adapter
 * 加密的 IndexedDB 存储适配器
 *
 * 使用 AES-GCM 256位加密保护存储数据
 */

import { StateStorage } from 'zustand/middleware'
import { indexedDBService, StoreName } from './indexedDB'
import { encrypt, decrypt } from './encryption'

/**
 * 创建加密的 IndexedDB Storage Adapter
 *
 * @param storeName - IndexedDB 存储区名称
 * @param keyName - 存储的键名
 * @param shouldEncrypt - 是否加密（某些数据如认证token不需要加密）
 */
export function createEncryptedStorage(
  storeName: StoreName,
  keyName: string = 'data',
  shouldEncrypt: boolean = true
): StateStorage {
  return {
    /**
     * 获取并解密数据
     */
    getItem: async (name: string) => {
      try {
        // 确保数据库已初始化
        await indexedDBService.init()

        const data = await indexedDBService.getItem<{ key: string; value: string }>(
          storeName,
          keyName
        )

        if (!data?.value) return null

        // 如果需要加密，则解密数据
        if (shouldEncrypt) {
          return await decrypt(data.value)
        }

        return data.value
      } catch (error) {
        console.error(`Encrypted storage getItem error (${storeName}):`, error)
        return null
      }
    },

    /**
     * 加密并存储数据
     */
    setItem: async (name: string, value: string) => {
      try {
        // 确保数据库已初始化
        await indexedDBService.init()

        // 如果需要加密，则加密数据
        const finalValue = shouldEncrypt ? await encrypt(value) : value

        await indexedDBService.setItem(storeName, {
          key: keyName,
          value: finalValue,
        })
      } catch (error) {
        console.error(`Encrypted storage setItem error (${storeName}):`, error)
      }
    },

    /**
     * 删除数据
     */
    removeItem: async (name: string) => {
      try {
        await indexedDBService.deleteItem(storeName, keyName)
      } catch (error) {
        console.error(`Encrypted storage removeItem error (${storeName}):`, error)
      }
    },
  }
}

/**
 * 预定义的加密存储适配器
 */

import { STORES } from './indexedDB'

// 聊天数据加密存储适配器（敏感数据需要加密）
export const encryptedChatStorage = createEncryptedStorage(
  STORES.CHAT_SESSIONS,
  'heartmirror-chat',
  true // 加密聊天消息
)

// 认证数据存储适配器（token不需要加密，已经有保护）
export const encryptedAuthStorage = createEncryptedStorage(
  STORES.AUTH,
  'heartmirror-auth',
  false // 认证token不需要额外加密
)

// AI设置加密存储适配器（API Key需要加密保护）
export const encryptedAISettingsStorage = createEncryptedStorage(
  STORES.AI_SETTINGS,
  'heartmirror-ai-settings',
  true // 加密API Key等敏感配置
)

// 用户档案加密存储适配器
export const encryptedUserProfileStorage = createEncryptedStorage(
  STORES.USER_PROFILE,
  'heartmirror-user-profile',
  true // 加密用户档案
)

export default createEncryptedStorage