import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const filename = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: filename });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const conversations = await prisma.conversation.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  // Server doesn't see the content, just returns metadata
  // Client decrypts to get preview
  return NextResponse.json({
    conversations: conversations.map(c => ({
      id: c.id,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
