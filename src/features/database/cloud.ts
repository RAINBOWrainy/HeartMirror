/**
 * Cloud mode database client - RLS-enabled PostgreSQL backend
 * Uses Next.js API routes with JWT authentication
 */

import { PrismaClient } from '@prisma/client'
import type { Message } from '@/features/ai/shared/types'

export interface ConversationInfo {
  id: string
  createdAt: string
  preview: string // Encrypted preview string
}

// Server-side RLS-aware Prisma client
// This should only be imported in server-side code / API routes

export function createRLSClient(userId: string): PrismaClient {
  const prisma = new PrismaClient()

  // Set RLS context before each query
  prisma.$use(async (params, next) => {
    await prisma.$executeRaw`SET app.current_user_id = ${userId}`
    const result = await next(params)
    await prisma.$executeRaw`RESET app.current_user_id`
    return result
  })

  return prisma
}

// Cloud mode types for server-side operations (called from API routes)
export class CloudDatabaseServer {
  private prisma: PrismaClient
  userId: string

  constructor(userId: string) {
    this.userId = userId
    this.prisma = createRLSClient(userId)
  }

  async listConversations(): Promise<
    Array<{
      id: string
      createdAt: Date
      encryptedContent: Buffer
      iv: Buffer
      authTag: Buffer
    }>
  > {
    return this.prisma.conversation.findMany({
      select: {
        id: true,
        createdAt: true,
        encryptedContent: true,
        iv: true,
        authTag: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getConversation(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        encryptedContent: true,
        iv: true,
        authTag: true,
      },
    })
  }

  async saveConversation(
    id: string,
    encryptedContent: Buffer,
    iv: Buffer,
    authTag: Buffer
  ): Promise<string> {
    await this.prisma.conversation.upsert({
      where: { id },
      update: {
        encryptedContent,
        iv,
        authTag,
      },
      create: {
        id,
        userId: this.userId, // RLS context from constructor
        encryptedContent,
        iv,
        authTag,
      },
    })

    return id
  }

  async deleteConversation(id: string): Promise<void> {
    await this.prisma.conversation.delete({
      where: { id },
    })
  }

  async deleteAllConversations(): Promise<void> {
    await this.prisma.conversation.deleteMany()
  }

  async disconnect(): Promise<void> {
    return this.prisma.$disconnect()
  }
}

// Cloud mode client for frontend
export const cloudClient = {
  getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('heartmirror_auth_token')
  },

  setAuthToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('heartmirror_auth_token', token)
  },

  clearAuthToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('heartmirror_auth_token')
  },

  async listConversations(): Promise<ConversationInfo[]> {
    const token = this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    return fetch('/api/conversations/list', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
  },

  async loadConversation(id: string): Promise<Message[]> {
    const token = this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    return fetch(`/api/conversations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json())
  },

  async saveConversation(
    encryptedData: {
      id: string
      encryptedContent: string
      iv: string
      authTag: string
    },
    _password: string, // Unused in cloud mode - encryption already happened client-side
    _existingId?: string
  ): Promise<string> {
    const token = this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    await fetch('/api/conversations/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(encryptedData),
    })

    return encryptedData.id
  },

  async deleteConversation(id: string): Promise<void> {
    const token = this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  async deleteAllConversations(): Promise<void> {
    const token = this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

    await fetch('/api/conversations/clear-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  async chatCompletion(request: {
    messages: Message[]
    apiKey: string
    provider: string
    baseUrl: string
    model: string
  }): Promise<string> {
    const token = this.getAuthToken()
    if (!token) throw new Error('Not authenticated')

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
