import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // Get user ID from middleware header (cloud mode RLS)
  const userId = request.headers.get('x-user-id') || null;

  // For cloud mode, Prisma RLS automatically filters by userId
  // For local mode, userId is null so all are returned
  const conversations = await prisma.conversation.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      createdAt: true,
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
      encryptedContent: Buffer.from(c.encryptedContent).toString('base64'),
      iv: Buffer.from(c.iv).toString('base64'),
      authTag: Buffer.from(c.authTag).toString('base64'),
    })),
  });
}
