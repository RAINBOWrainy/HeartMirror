/**
 * Chat Store
 * 聊天状态管理 - 支持会话管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Message, ChatSessionState } from '../types'

// 重新导出类型以保持向后兼容
export type { Message, ChatSessionState } from '../types'

// 导出 ChatSession 类型别名
export type ChatSession = ChatSessionState

interface ChatState {
  currentSession: ChatSession | null
  sessions: ChatSession[]
  isLoading: boolean
  // 会话操作
  setCurrentSession: (session: ChatSession | null) => void
  createSession: (id?: string, title?: string) => ChatSession
  addSession: (session: ChatSession) => void
  removeSession: (id: string) => void
  updateSession: (id: string, updates: Partial<ChatSession>) => void
  // 消息操作
  addMessage: (message: Message) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
  // 批量操作
  setSessions: (sessions: ChatSession[]) => void
  clearAll: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: [],
      isLoading: false,

      setCurrentSession: (session) => set({ currentSession: session }),

      createSession: (id, title) => {
        const newSession: ChatSession = {
          id: id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: title || '新对话',
          messages: [],
          currentStage: 'greeting',
          createdAt: new Date(),
          lastMessageAt: new Date()
        }
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSession: newSession
        }))
        return newSession
      },

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions]
        })),

      removeSession: (id) =>
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== id)
          const newCurrentSession = state.currentSession?.id === id ? null : state.currentSession
          return {
            sessions: newSessions,
            currentSession: newCurrentSession
          }
        }),

      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
          currentSession: state.currentSession?.id === id
            ? { ...state.currentSession, ...updates }
            : state.currentSession
        })),

      addMessage: (message) =>
        set((state) => {
          if (!state.currentSession) {
            // 如果没有当前会话，创建一个新会话
            const newSession: ChatSession = {
              id: `session_${Date.now()}`,
              title: '新对话',
              messages: [message],
              currentStage: 'greeting',
              createdAt: new Date(),
              lastMessageAt: new Date()
            }
            return {
              currentSession: newSession,
              sessions: [newSession, ...state.sessions]
            }
          }
          return {
            currentSession: {
              ...state.currentSession,
              messages: [...state.currentSession.messages, message],
              lastMessageAt: new Date()
            },
            sessions: state.sessions.map((s) =>
              s.id === state.currentSession?.id
                ? { ...s, messages: [...s.messages, message], lastMessageAt: new Date() }
                : s
            )
          }
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      clearMessages: () =>
        set((state) => {
          if (!state.currentSession) return state
          return {
            currentSession: {
              ...state.currentSession,
              messages: [],
            },
          }
        }),

      setSessions: (sessions) => set({ sessions }),

      clearAll: () => set({
        currentSession: null,
        sessions: [],
        isLoading: false
      })
    }),
    {
      name: 'heartmirror-chat',
      // 只持久化会话列表，不持久化当前会话的消息
      partialize: (state) => ({
        sessions: state.sessions.map(s => ({
          ...s,
          messages: [] // 不持久化消息，减少存储
        }))
      })
    }
  )
)