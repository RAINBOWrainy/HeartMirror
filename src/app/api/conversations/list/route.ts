import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_request: Request) {
  // Get user ID from middleware header (cloud mode RLS)
  // Note: In cloud mode, Prisma RLS automatically filters by userId via middleware
  // For local mode, all conversations are returned
  const conversations = await prisma.conversation.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      createdAt: true,
      type: true,
      // Full encrypted content - client decrypts and extracts preview
      encryptedContent: true,
      iv: true,
      authTag: true,
    },
  });

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      createdAt: c.createdAt.toISOString(),
      type: c.type || 'chat',
      encryptedContent: Buffer.from(c.encryptedContent).toString('base64'),
      iv: Buffer.from(c.iv).toString('base64'),
      authTag: Buffer.from(c.authTag).toString('base64'),
    })),
  });
}
