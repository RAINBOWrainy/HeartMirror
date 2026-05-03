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
      // Select encrypted preview fields for fast list loading
      // Server never decrypts - just passes encrypted bytes to client
      previewCiphertext: true,
      previewIv: true,
      previewAuthTag: true,
      previewSalt: true,
    },
  });

  return NextResponse.json({
    conversations: conversations.map(c => ({
      id: c.id,
      createdAt: c.createdAt.toISOString(),
      // Include encrypted preview - client decrypts locally
      // This avoids O(n) full conversation decryption during list
      encryptedPreview: c.previewCiphertext
        ? {
            ciphertext: Buffer.from(c.previewCiphertext).toString('base64'),
            iv: Buffer.from(c.previewIv).toString('base64'),
            authTag: Buffer.from(c.previewAuthTag).toString('base64'),
            salt: Buffer.from(c.previewSalt).toString('base64'),
          }
        : null,
    })),
  });
}
