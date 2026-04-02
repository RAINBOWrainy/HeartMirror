/**
 * IndexedDB Storage Service
 * 纯本地应用的核心存储服务
 *
 * 特点:
 * - 无大小限制 (相比localStorage 5MB限制)
 * - 支持多个数据存储区 (stores)
 * - 异步API，高性能
 * - 为后续加密预留接口
 */

const DB_NAME = 'HeartMirrorDB'
const DB_VERSION = 1

// 数据存储区定义
export const STORES = {
  CHAT_SESSIONS: 'chatSessions',      // 聊天会话
  CHAT_MESSAGES: 'chatMessages',      // 聊天消息
  AUTH: 'auth',                       // 认证信息
  AI_SETTINGS: 'aiSettings',          // AI设置
  DIARY: 'diary',                     // 日记
  EMOTION_RECORDS: 'emotionRecords',  // 情绪记录
  USER_PROFILE: 'userProfile',        // 用户档案
} as const

export type StoreName = typeof STORES[keyof typeof STORES]

// IndexedDB 实例
let db: IDBDatabase | null = null
let dbInitPromise: Promise<IDBDatabase> | null = null

/**
 * 初始化 IndexedDB
 * 创建数据库和所有存储区
 */
export async function initDB(): Promise<IDBDatabase> {
  // 如果已经初始化完成，直接返回
  if (db) return db

  // 如果正在初始化，等待完成
  if (dbInitPromise) return dbInitPromise

  dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    // 数据库升级时创建存储区
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // 聊天会话存储区 - 以id为主键
      if (!database.objectStoreNames.contains(STORES.CHAT_SESSIONS)) {
        const sessionStore = database.createObjectStore(STORES.CHAT_SESSIONS, { keyPath: 'id' })
        sessionStore.createIndex('createdAt', 'createdAt', { unique: false })
        sessionStore.createIndex('lastMessageAt', 'lastMessageAt', { unique: false })
      }

      // 聊天消息存储区 - 以sessionId+timestamp复合键
      if (!database.objectStoreNames.contains(STORES.CHAT_MESSAGES)) {
        const messageStore = database.createObjectStore(STORES.CHAT_MESSAGES, { keyPath: 'id' })
        messageStore.createIndex('sessionId', 'sessionId', { unique: false })
        messageStore.createIndex('timestamp', 'timestamp', { unique: false })
        messageStore.createIndex('session_timestamp', ['sessionId', 'timestamp'], { unique: false })
      }

      // 认证信息存储区 - 单条记录
      if (!database.objectStoreNames.contains(STORES.AUTH)) {
        database.createObjectStore(STORES.AUTH, { keyPath: 'key' })
      }

      // AI设置存储区 - 单条记录
      if (!database.objectStoreNames.contains(STORES.AI_SETTINGS)) {
        database.createObjectStore(STORES.AI_SETTINGS, { keyPath: 'key' })
      }

      // 日记存储区
      if (!database.objectStoreNames.contains(STORES.DIARY)) {
        const diaryStore = database.createObjectStore(STORES.DIARY, { keyPath: 'id' })
        diaryStore.createIndex('createdAt', 'created_at', { unique: false })
        diaryStore.createIndex('mood', 'mood', { unique: false })
      }

      // 情绪记录存储区
      if (!database.objectStoreNames.contains(STORES.EMOTION_RECORDS)) {
        const emotionStore = database.createObjectStore(STORES.EMOTION_RECORDS, { keyPath: 'id' })
        emotionStore.createIndex('recordedAt', 'recorded_at', { unique: false })
        emotionStore.createIndex('emotion', 'primary_emotion', { unique: false })
      }

      // 用户档案存储区 - 单条记录
      if (!database.objectStoreNames.contains(STORES.USER_PROFILE)) {
        database.createObjectStore(STORES.USER_PROFILE, { keyPath: 'key' })
      }
    }

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })

  return dbInitPromise
}

/**
 * 获取数据库实例
 * 如果未初始化会自动初始化
 */
export async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    return initDB()
  }
  return db
}

/**
 * 获取存储区对象
 */
async function getStore(storeName: StoreName, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  const database = await getDB()
  const transaction = database.transaction(storeName, mode)
  return transaction.objectStore(storeName)
}

/**
 * 添加或更新数据
 */
export async function setItem<T>(storeName: StoreName, data: T): Promise<void> {
  const store = await getStore(storeName, 'readwrite')
  return new Promise<void>((resolve, reject) => {
    const request = store.put(data)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取单条数据
 */
export async function getItem<T>(storeName: StoreName, key: string): Promise<T | null> {
  const store = await getStore(storeName, 'readonly')
  return new Promise<T | null>((resolve, reject) => {
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取所有数据
 */
export async function getAllItems<T>(storeName: StoreName): Promise<T[]> {
  const store = await getStore(storeName, 'readonly')
  return new Promise<T[]>((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * 删除数据
 */
export async function deleteItem(storeName: StoreName, key: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite')
  return new Promise<void>((resolve, reject) => {
    const request = store.delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 清空存储区
 */
export async function clearStore(storeName: StoreName): Promise<void> {
  const store = await getStore(storeName, 'readwrite')
  return new Promise<void>((resolve, reject) => {
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 通过索引查询数据
 */
export async function getByIndex<T>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  const store = await getStore(storeName, 'readonly')
  const index = store.index(indexName)
  return new Promise<T[]>((resolve, reject) => {
    const request = index.getAll(value)
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

/**
 * 批量添加数据
 */
export async function bulkSetItems<T>(storeName: StoreName, items: T[]): Promise<void> {
  const database = await getDB()
  const transaction = database.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)

  return new Promise<void>((resolve, reject) => {
    for (const item of items) {
      store.put(item)
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/**
 * 检查数据库是否已初始化
 */
export function isDBInitialized(): boolean {
  return db !== null
}

/**
 * 关闭数据库连接
 */
export function closeDB(): void {
  if (db) {
    db.close()
    db = null
    dbInitPromise = null
  }
}

/**
 * 删除整个数据库
 * 用于清空所有数据或重置应用
 */
export async function deleteDatabase(): Promise<void> {
  closeDB()
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 导出默认服务对象
export const indexedDBService = {
  init: initDB,
  get: getDB,
  setItem,
  getItem,
  getAllItems,
  deleteItem,
  clearStore,
  getByIndex,
  bulkSetItems,
  isInitialized: isDBInitialized,
  close: closeDB,
  deleteDatabase,
  STORES,
}

export default indexedDBService