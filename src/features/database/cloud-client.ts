/**
 * Cloud mode database client for frontend
 * Handles encrypted conversation storage via API calls
 */

import type { Message } from '@/features/ai/shared/types'
import { getAuthToken } from '@/contexts/AuthContext'

export interface ConversationInfo {
  id: string
  createdAt: string
  preview?: string
}

function getToken(): string {
  const token = getAuthToken()
  if (!token) throw new Error('Not authenticated')
  return token
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Authentication expired. Please login again.')
    }
    throw new Error(`API error: ${res.status}`)
  }

  return res.json()
}

export const cloudClient = {
  async listConversations(): Promise<ConversationInfo[]> {
    return fetchWithAuth('/api/conversations/list')
  },

  async loadConversation(id: string): Promise<Message[]> {
    return fetchWithAuth(`/api/conversations/${id}`)
  },

  async saveConversation(
    id: string,
    encryptedData: {
      encryptedContent: string
      iv: string
      authTag: string
    }
  ): Promise<string> {
    await fetchWithAuth('/api/conversations/save', {
      method: 'POST',
      body: JSON.stringify({ id, ...encryptedData }),
    })
    return id
  },

  async deleteConversation(id: string): Promise<void> {
    await fetchWithAuth(`/api/conversations/${id}`, { method: 'DELETE' })
  },

  async deleteAllConversations(): Promise<void> {
    await fetchWithAuth('/api/conversations/clear-all', { method: 'POST' })
  },

  async chatCompletion(request: {
    messages: Message[]
    apiKey: string
    provider: string
    baseUrl: string
    model: string
  }): Promise<string> {
    const token = getToken()
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: request.messages,
        provider: request.provider,
        baseUrl: request.baseUrl,
        model: request.model,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get response')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader!.read()
      if (done) break
      fullResponse += decoder.decode(value)
    }

    return fullResponse
  },
}