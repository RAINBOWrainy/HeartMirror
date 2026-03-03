/**
 * Frontend Services Module
 */
export { default as api, authApi, chatApi, emotionApi, diaryApi, dashboardApi, crisisApi } from './api'
export { default as wsService, wsService as websocket } from './websocket'
export type { WebSocketMessage, MessageHandler, MessageType } from './websocket'