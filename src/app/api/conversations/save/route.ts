import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const filename = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: filename });
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  const body = await request.json();
  const { id, encryptedContent, iv, authTag, salt, encryptedPreview } = body;

  const encryptedContentBuffer = Buffer.from(encryptedContent, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const authTagBuffer = Buffer.from(authTag, 'base64');
  const saltBuffer = Buffer.from(salt, 'base64');

  const updateData: Record<string, Buffer> = {
    encryptedContent: encryptedContentBuffer,
    iv: ivBuffer,
    authTag: authTagBuffer,
    salt: saltBuffer,
  };

  // Add preview fields if provided (backward compatible)
  if (encryptedPreview) {
    updateData.previewCiphertext = Buffer.from(encryptedPreview.ciphertext, 'base64');
    updateData.previewIv = Buffer.from(encryptedPreview.iv, 'base64');
    updateData.previewAuthTag = Buffer.from(encryptedPreview.authTag, 'base64');
    updateData.previewSalt = Buffer.from(encryptedPreview.salt, 'base64');
  }

  // Server just stores the encrypted bytes - can't read content
  await prisma.conversation.upsert({
    where: { id },
    update: updateData,
    create: {
      id,
      encryptedContent: encryptedContentBuffer,
      iv: ivBuffer,
      authTag: authTagBuffer,
      salt: saltBuffer,
      previewCiphertext: encryptedPreview ? Buffer.from(encryptedPreview.ciphertext, 'base64') : null,
      previewIv: encryptedPreview ? Buffer.from(encryptedPreview.iv, 'base64') : null,
      previewAuthTag: encryptedPreview ? Buffer.from(encryptedPreview.authTag, 'base64') : null,
      previewSalt: encryptedPreview ? Buffer.from(encryptedPreview.salt, 'base64') : null,
    },
  });

  return NextResponse.json({ id, success: true });
}
