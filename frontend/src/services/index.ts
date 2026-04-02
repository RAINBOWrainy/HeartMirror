/**
 * Frontend Services Module
 */
export { default as api, authApi, chatApi, emotionApi, diaryApi, dashboardApi, crisisApi } from './api'
export { default as wsService, wsService as websocket } from './websocket'
export type { WebSocketMessage, MessageHandler, MessageType } from './websocket'

// IndexedDB 存储服务
export { indexedDBService, STORES } from './indexedDB'
export type { StoreName } from './indexedDB'
export { createIndexedDBStorage, chatStorage, authStorage, aiSettingsStorage, userProfileStorage } from './zustandIndexedDBStorage'

// 本地日记服务
export { localDiaryService } from './localDiary'
export type { DiaryItem } from './localDiary'

// 加密服务
export { encryptionService, encrypt, decrypt, encryptObject, decryptObject } from './encryption'

// 加密存储适配器
export { createEncryptedStorage, encryptedChatStorage, encryptedAuthStorage, encryptedAISettingsStorage, encryptedUserProfileStorage } from './encryptedStorage'