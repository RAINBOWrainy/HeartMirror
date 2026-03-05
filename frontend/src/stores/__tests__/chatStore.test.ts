/**
 * ChatStore Tests
 * 聊天状态管理测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useChatStore } from '../chatStore'
import { Message } from '../../types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useChatStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.setState({
      currentSession: null,
      sessions: [],
      isLoading: false,
    })
  })

  it('should have correct initial state', () => {
    const state = useChatStore.getState()
    expect(state.currentSession).toBeNull()
    expect(state.sessions).toEqual([])
    expect(state.isLoading).toBe(false)
  })

  it('should create a new session', () => {
    const { createSession } = useChatStore.getState()
    const session = createSession()

    expect(session.id).toBeDefined()
    expect(session.title).toBe('新对话')
    expect(session.messages).toEqual([])
    expect(session.currentStage).toBe('greeting')

    const state = useChatStore.getState()
    expect(state.currentSession).toEqual(session)
    expect(state.sessions.length).toBe(1)
  })

  it('should create session with custom id and title', () => {
    const { createSession } = useChatStore.getState()
    const session = createSession('custom-id', '自定义标题')

    expect(session.id).toBe('custom-id')
    expect(session.title).toBe('自定义标题')
  })

  it('should set current session', () => {
    const { setCurrentSession } = useChatStore.getState()
    const mockSession = {
      id: 'test-session',
      title: '测试会话',
      messages: [],
      currentStage: 'greeting' as const,
      createdAt: new Date(),
      lastMessageAt: new Date(),
    }

    setCurrentSession(mockSession)

    const state = useChatStore.getState()
    expect(state.currentSession).toEqual(mockSession)
  })

  it('should add a session', () => {
    const { addSession } = useChatStore.getState()
    const mockSession = {
      id: 'added-session',
      title: '添加的会话',
      messages: [],
      currentStage: 'greeting' as const,
      createdAt: new Date(),
      lastMessageAt: new Date(),
    }

    addSession(mockSession)

    const state = useChatStore.getState()
    expect(state.sessions.length).toBe(1)
    expect(state.sessions[0]).toEqual(mockSession)
  })

  it('should remove a session', () => {
    const { createSession, removeSession } = useChatStore.getState()
    const session = createSession()

    removeSession(session.id)

    const state = useChatStore.getState()
    expect(state.sessions.length).toBe(0)
    expect(state.currentSession).toBeNull()
  })

  it('should update a session', () => {
    const { createSession, updateSession } = useChatStore.getState()
    const session = createSession()

    updateSession(session.id, { title: '更新后的标题' })

    const state = useChatStore.getState()
    expect(state.currentSession?.title).toBe('更新后的标题')
  })

  it('should add message to current session', () => {
    const { createSession, addMessage } = useChatStore.getState()
    createSession()

    const message: Message = {
      id: 'msg-1',
      role: 'user',
      content: '你好',
      timestamp: new Date(),
    }

    addMessage(message)

    const state = useChatStore.getState()
    expect(state.currentSession?.messages.length).toBe(1)
    expect(state.currentSession?.messages[0]).toEqual(message)
  })

  it('should create new session when adding message without current session', () => {
    const { addMessage } = useChatStore.getState()

    const message: Message = {
      id: 'msg-1',
      role: 'user',
      content: '你好',
      timestamp: new Date(),
    }

    addMessage(message)

    const state = useChatStore.getState()
    expect(state.currentSession).not.toBeNull()
    expect(state.currentSession?.messages.length).toBe(1)
    expect(state.sessions.length).toBe(1)
  })

  it('should set loading state', () => {
    const { setLoading } = useChatStore.getState()

    setLoading(true)
    expect(useChatStore.getState().isLoading).toBe(true)

    setLoading(false)
    expect(useChatStore.getState().isLoading).toBe(false)
  })

  it('should clear messages', () => {
    const { createSession, addMessage, clearMessages } = useChatStore.getState()
    createSession()

    const message: Message = {
      id: 'msg-1',
      role: 'user',
      content: '你好',
      timestamp: new Date(),
    }

    addMessage(message)
    clearMessages()

    const state = useChatStore.getState()
    expect(state.currentSession?.messages).toEqual([])
  })

  it('should set sessions', () => {
    const { setSessions } = useChatStore.getState()
    const mockSessions = [
      {
        id: 'session-1',
        title: '会话1',
        messages: [],
        currentStage: 'greeting' as const,
        createdAt: new Date(),
        lastMessageAt: new Date(),
      },
      {
        id: 'session-2',
        title: '会话2',
        messages: [],
        currentStage: 'greeting' as const,
        createdAt: new Date(),
        lastMessageAt: new Date(),
      },
    ]

    setSessions(mockSessions)

    const state = useChatStore.getState()
    expect(state.sessions.length).toBe(2)
  })

  it('should clear all', () => {
    const { createSession, addMessage, clearAll } = useChatStore.getState()
    createSession()

    const message: Message = {
      id: 'msg-1',
      role: 'user',
      content: '你好',
      timestamp: new Date(),
    }

    addMessage(message)
    clearAll()

    const state = useChatStore.getState()
    expect(state.currentSession).toBeNull()
    expect(state.sessions).toEqual([])
    expect(state.isLoading).toBe(false)
  })
})