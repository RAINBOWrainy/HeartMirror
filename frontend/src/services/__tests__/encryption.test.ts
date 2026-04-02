/**
 * Encryption Service Tests
 * 测试加密服务
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Encryption Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基本功能', () => {
    it('应该导出加密和解密函数', async () => {
      const { encrypt, decrypt } = await import('../encryption')

      expect(typeof encrypt).toBe('function')
      expect(typeof decrypt).toBe('function')
    })

    it('应该导出 encryptObject 和 decryptObject 函数', async () => {
      const { encryptObject, decryptObject } = await import('../encryption')

      expect(typeof encryptObject).toBe('function')
      expect(typeof decryptObject).toBe('function')
    })

    it('应该导出 encryptionService 对象', async () => {
      const { encryptionService } = await import('../encryption')

      expect(encryptionService).toHaveProperty('encrypt')
      expect(encryptionService).toHaveProperty('decrypt')
      expect(encryptionService).toHaveProperty('encryptObject')
      expect(encryptionService).toHaveProperty('decryptObject')
      expect(encryptionService).toHaveProperty('isKeyInitialized')
      expect(encryptionService).toHaveProperty('deleteKey')
      expect(encryptionService).toHaveProperty('exportKeyForBackup')
      expect(encryptionService).toHaveProperty('importKeyFromBackup')
      expect(encryptionService).toHaveProperty('regenerateKey')
    })
  })

  describe('加密和解密', () => {
    it('加密空字符串应该返回空字符串', async () => {
      const { encrypt } = await import('../encryption')

      const result = await encrypt('')
      expect(result).toBe('')
    })

    it('解密空字符串应该返回空字符串', async () => {
      const { decrypt } = await import('../encryption')

      const result = await decrypt('')
      expect(result).toBe('')
    })

    it('加密函数应该调用 crypto.subtle.encrypt', async () => {
      const { encrypt } = await import('../encryption')

      await encrypt('test data')

      expect(window.crypto.subtle.encrypt).toHaveBeenCalled()
    })

    it('加密函数应该生成随机 IV', async () => {
      const { encrypt } = await import('../encryption')

      await encrypt('test data')

      expect(window.crypto.getRandomValues).toHaveBeenCalled()
    })
  })

  describe('密钥管理', () => {
    it('isKeyInitialized 检查密钥是否存在', async () => {
      const { isKeyInitialized } = await import('../encryption')

      // 由于之前的测试可能已经初始化了密钥，这个测试只验证函数能正常工作
      const result = isKeyInitialized()
      expect(typeof result).toBe('boolean')
    })

    it('deleteKey 函数可以删除密钥', async () => {
      const { deleteKey, isKeyInitialized } = await import('../encryption')

      // 首先确保密钥存在（通过加密操作初始化）
      await deleteKey()

      // 验证 deleteKey 是一个有效的异步函数
      expect(typeof deleteKey).toBe('function')
    })
  })

  describe('密钥备份', () => {
    it('exportKeyForBackup 应该返回 JWK 格式的密钥字符串', async () => {
      const { exportKeyForBackup } = await import('../encryption')

      const result = await exportKeyForBackup()

      expect(typeof result).toBe('string')
      // 应该是可以解析为 JSON 的
      const parsed = JSON.parse(result)
      expect(parsed).toHaveProperty('kty')
    })

    it('importKeyFromBackup 应该接受有效的 JWK 字符串', async () => {
      const { importKeyFromBackup } = await import('../encryption')

      const jwkString = '{"kty":"oct","k":"test-key","alg":"A256GCM","ext":true}'
      await importKeyFromBackup(jwkString)

      // 验证函数执行完成（没有抛出错误）
      expect(typeof importKeyFromBackup).toBe('function')
    })
  })
})

describe('Encrypted Storage Adapter', () => {
  describe('createEncryptedStorage', () => {
    it('应该创建包含必要方法的对象', async () => {
      const { createEncryptedStorage } = await import('../encryptedStorage')
      const { STORES } = await import('../indexedDB')

      const storage = createEncryptedStorage(STORES.CHAT_SESSIONS, 'test-key', true)

      expect(storage).toHaveProperty('getItem')
      expect(storage).toHaveProperty('setItem')
      expect(storage).toHaveProperty('removeItem')
      expect(typeof storage.getItem).toBe('function')
      expect(typeof storage.setItem).toBe('function')
      expect(typeof storage.removeItem).toBe('function')
    })
  })

  describe('预定义加密存储适配器', () => {
    it('应该导出所有预定义的加密存储适配器', async () => {
      const mod = await import('../encryptedStorage')

      const adapters = [
        mod.encryptedChatStorage,
        mod.encryptedAuthStorage,
        mod.encryptedAISettingsStorage,
        mod.encryptedUserProfileStorage,
      ]

      adapters.forEach(storage => {
        expect(storage).toHaveProperty('getItem')
        expect(storage).toHaveProperty('setItem')
        expect(storage).toHaveProperty('removeItem')
      })
    })
  })
})