import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    conversations: conversations.map((c: {
      id: string;
      createdAt: Date;
      previewCiphertext: Buffer | null;
      previewIv: Buffer | null;
      previewAuthTag: Buffer | null;
      previewSalt: Buffer | null;
    }) => ({
      id: c.id,
      createdAt: c.createdAt.toISOString(),
      // Include encrypted preview - client decrypts locally
      // This avoids O(n) full conversation decryption during list
      encryptedPreview: c.previewCiphertext && c.previewIv && c.previewAuthTag && c.previewSalt
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
