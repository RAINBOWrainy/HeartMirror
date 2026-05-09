/**
 * Cloud Mode RLS (Row Level Security) Tests
 * Tests that users can only access their own data
 * Requires PostgreSQL schema - skipped if TEST_DATABASE_URL not set
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

const databaseUrl = process.env.TEST_DATABASE_URL

if (!databaseUrl) {
  describe('Cloud Mode RLS', () => {
    it('skips RLS tests when TEST_DATABASE_URL not set', () => {
      console.log('Skipping RLS tests - no test database configured')
    })
  })
} else {
  // @ts-ignore - PrismaClient with user property only exists in cloud schema
  let prisma: any

  const user1Id = 'user-1-test-id'
  const user2Id = 'user-2-test-id'
  const user1ConversationId = 'conv-1-test-id'
  const user2ConversationId = 'conv-2-test-id'

  beforeAll(async () => {
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    })

    // Clean up any existing test data
    await cleanup()
  })

  afterAll(async () => {
    if (prisma) {
      await cleanup()
      await prisma.$disconnect()
    }
  })

  async function cleanup() {
    if (!prisma) return
    try {
      await prisma.conversation.deleteMany({
        where: { id: { in: [user1ConversationId, user2ConversationId] } },
      })
      await prisma.user.deleteMany({
        where: { id: { in: [user1Id, user2Id] } },
      })
    } catch {
      // Ignore cleanup errors
    }
  }

  async function setRLSContext(userId: string) {
    await prisma.$executeRawUnsafe(`SET app.current_user_id = '${userId}'`)
  }

  async function resetRLSContext() {
    await prisma.$executeRawUnsafe('RESET app.current_user_id')
  }

  describe('Cloud Mode RLS', () => {
    it('should create users', async () => {
      await prisma.user.create({
        data: {
          id: user1Id,
          email: 'user1@test.com',
          encryptedDek: Buffer.from('test-encrypted-dek-1'),
          dekSalt: Buffer.from('test-dek-salt-1'),
          dekIv: Buffer.from('test-dek-iv-1'),
          dekAuthTag: Buffer.from('test-dek-tag-1'),
          passwordVerifier: Buffer.from('test-password-verifier-1'),
          salt: Buffer.from('test-salt-1'),
        },
      })

      await prisma.user.create({
        data: {
          id: user2Id,
          email: 'user2@test.com',
          encryptedDek: Buffer.from('test-encrypted-dek-2'),
          dekSalt: Buffer.from('test-dek-salt-2'),
          dekIv: Buffer.from('test-dek-iv-2'),
          dekAuthTag: Buffer.from('test-dek-tag-2'),
          passwordVerifier: Buffer.from('test-password-verifier-2'),
          salt: Buffer.from('test-salt-2'),
        },
      })

      const users = await prisma.user.findMany()
      expect(users).toHaveLength(2)
    })

    it('should create conversations with userId', async () => {
      await prisma.conversation.create({
        data: {
          id: user1ConversationId,
          userId: user1Id,
          encryptedContent: Buffer.from('user1-conversation-content'),
          iv: Buffer.from('user1-iv'),
          authTag: Buffer.from('user1-tag'),
        },
      })

      await prisma.conversation.create({
        data: {
          id: user2ConversationId,
          userId: user2Id,
          encryptedContent: Buffer.from('user2-conversation-content'),
          iv: Buffer.from('user2-iv'),
          authTag: Buffer.from('user2-tag'),
        },
      })

      const conversations = await prisma.conversation.findMany()
      expect(conversations).toHaveLength(2)
    })

    it('should allow user1 to read their own conversation with RLS', async () => {
      await setRLSContext(user1Id)

      const conversation = await prisma.conversation.findUnique({
        where: { id: user1ConversationId },
      })

      await resetRLSContext()

      expect(conversation).not.toBeNull()
      expect(conversation?.id).toBe(user1ConversationId)
    })

    it('should deny user1 access to user2 conversation with RLS', async () => {
      await setRLSContext(user1Id)

      const conversation = await prisma.conversation.findUnique({
        where: { id: user2ConversationId },
      })

      await resetRLSContext()

      expect(conversation).toBeNull()
    })

    it('should allow user2 to read their own conversation with RLS', async () => {
      await setRLSContext(user2Id)

      const conversation = await prisma.conversation.findUnique({
        where: { id: user2ConversationId },
      })

      await resetRLSContext()

      expect(conversation).not.toBeNull()
      expect(conversation?.id).toBe(user2ConversationId)
    })

    it('should deny user2 access to user1 conversation with RLS', async () => {
      await setRLSContext(user2Id)

      const conversation = await prisma.conversation.findUnique({
        where: { id: user1ConversationId },
      })

      await resetRLSContext()

      expect(conversation).toBeNull()
    })

    it('should deny user1 delete of user2 conversation', async () => {
      await setRLSContext(user1Id)

      await expect(
        prisma.conversation.delete({
          where: { id: user2ConversationId },
        })
      ).rejects.toThrow()

      await resetRLSContext()
    })

    it('should deny user1 update of user2 conversation', async () => {
      await setRLSContext(user1Id)

      await expect(
        prisma.conversation.update({
          where: { id: user2ConversationId },
          data: { encryptedContent: Buffer.from('hacked') },
        })
      ).rejects.toThrow()

      await resetRLSContext()
    })
  })
}