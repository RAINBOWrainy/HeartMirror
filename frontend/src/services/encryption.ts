/**
 * Encryption Service
 * 数据加密服务 - 保护用户隐私
 *
 * 特点:
 * - 使用 Web Crypto API (AES-GCM 256位加密)
 * - 浏览器原生支持，无需外部依赖
 * - 密钥存储在 IndexedDB 中
 * - 支持密钥导入/导出用于备份
 */

// 密钥存储名称
const ENCRYPTION_KEY_STORE = 'encryption-key'
const KEY_NAME = 'heartmirror-master-key'

// 加密算法配置
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // AES-GCM 推荐 IV 长度

/**
 * 生成加密密钥
 */
async function generateKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // 可导出，用于备份
    ['encrypt', 'decrypt']
  )
}

/**
 * 导出密钥为可存储格式
 */
async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return await window.crypto.subtle.exportKey('jwk', key)
}

/**
 * 导入密钥
 */
async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * 从 IndexedDB 获取或创建密钥
 */
async function getOrCreateKey(): Promise<CryptoKey> {
  // 尝试从 IndexedDB 获取现有密钥
  const storedKey = await getStoredKey()

  if (storedKey) {
    return await importKey(storedKey)
  }

  // 生成新密钥
  const newKey = await generateKey()
  const exportedKey = await exportKey(newKey)

  // 存储密钥
  await storeKey(exportedKey)

  return newKey
}

/**
 * 存储密钥到 IndexedDB
 */
async function storeKey(jwk: JsonWebKey): Promise<void> {
  // 使用 localStorage 作为简单存储（密钥本身也是加密保护的一部分）
  // 或者使用 IndexedDB
  localStorage.setItem(KEY_NAME, JSON.stringify(jwk))
}

/**
 * 从 IndexedDB 获取存储的密钥
 */
async function getStoredKey(): Promise<JsonWebKey | null> {
  const stored = localStorage.getItem(KEY_NAME)
  if (!stored) return null

  try {
    return JSON.parse(stored) as JsonWebKey
  } catch {
    return null
  }
}

/**
 * 字符串转 ArrayBuffer
 */
function stringToArrayBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

/**
 * ArrayBuffer 转字符串
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

/**
 * ArrayBuffer 转 Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Base64 转 ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * 加密字符串
 *
 * @param plaintext - 要加密的文本
 * @returns 加密后的数据（Base64编码，包含IV）
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext) return ''

  try {
    const key = await getOrCreateKey()

    // 生成随机 IV
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    // 加密
    const encodedData = stringToArrayBuffer(plaintext)
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encodedData.buffer as ArrayBuffer
    )

    // 合并 IV 和加密数据
    const combined = new Uint8Array(iv.length + encryptedData.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encryptedData), iv.length)

    // 返回 Base64 编码
    return arrayBufferToBase64(combined.buffer)
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * 解密字符串
 *
 * @param encryptedData - 加密的数据（Base64编码）
 * @returns 解密后的原始文本
 */
export async function decrypt(encryptedData: string): Promise<string> {
  if (!encryptedData) return ''

  try {
    const key = await getOrCreateKey()

    // Base64 解码
    const combined = base64ToArrayBuffer(encryptedData)
    const combinedArray = new Uint8Array(combined)

    // 分离 IV 和加密数据
    const iv = combinedArray.slice(0, IV_LENGTH)
    const data = combinedArray.slice(IV_LENGTH)

    // 解密
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      data
    )

    return arrayBufferToString(decryptedData)
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * 批量加密对象
 */
export async function encryptObject<T>(obj: T): Promise<string> {
  const jsonString = JSON.stringify(obj)
  return await encrypt(jsonString)
}

/**
 * 批量解密对象
 */
export async function decryptObject<T>(encryptedData: string): Promise<T> {
  const jsonString = await decrypt(encryptedData)
  return JSON.parse(jsonString) as T
}

/**
 * 检查是否已初始化密钥
 */
export function isKeyInitialized(): boolean {
  return localStorage.getItem(KEY_NAME) !== null
}

/**
 * 删除所有加密密钥（用于数据重置）
 */
export async function deleteKey(): Promise<void> {
  localStorage.removeItem(KEY_NAME)
}

/**
 * 导出密钥用于备份
 *
 * @returns 密钥的 JWK 格式（用户可以保存到文件）
 */
export async function exportKeyForBackup(): Promise<string> {
  const key = await getOrCreateKey()
  const jwk = await exportKey(key)
  return JSON.stringify(jwk)
}

/**
 * 从备份导入密钥
 *
 * @param jwkString - 密钥的 JWK 格式字符串
 */
export async function importKeyFromBackup(jwkString: string): Promise<void> {
  try {
    const jwk = JSON.parse(jwkString) as JsonWebKey
    await storeKey(jwk)
  } catch (error) {
    throw new Error('Invalid key format')
  }
}

/**
 * 重新生成密钥（慎用！旧数据将无法解密）
 */
export async function regenerateKey(): Promise<CryptoKey> {
  // 删除旧密钥
  await deleteKey()

  // 生成新密钥
  const newKey = await generateKey()
  const exportedKey = await exportKey(newKey)
  await storeKey(exportedKey)

  return newKey
}

// 导出加密服务对象
export const encryptionService = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  isKeyInitialized,
  deleteKey,
  exportKeyForBackup,
  importKeyFromBackup,
  regenerateKey,
}

export default encryptionService