import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  emotion?: string
  emotionIntensity?: number
  timestamp: Date
}

export interface ChatSession {
  id: string
  title?: string
  messages: Message[]
  currentStage: string
  createdAt: Date
}

interface ChatState {
  currentSession: ChatSession | null
  sessions: ChatSession[]
  isLoading: boolean
  setCurrentSession: (session: ChatSession | null) => void
  addMessage: (message: Message) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,
  setCurrentSession: (session) => set({ currentSession: session }),
  addMessage: (message) =>
    set((state) => {
      if (!state.currentSession) return state
      return {
        currentSession: {
          ...state.currentSession,
          messages: [...state.currentSession.messages, message],
        },
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
}))