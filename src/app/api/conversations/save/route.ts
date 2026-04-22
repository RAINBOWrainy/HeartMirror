import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const filename = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: filename });
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  const body = await request.json();
  const { id, encryptedContent, iv, authTag } = body;

  const encryptedContentBuffer = Buffer.from(encryptedContent, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const authTagBuffer = Buffer.from(authTag, 'base64');

  // Server just stores the encrypted bytes - can't read content
  await prisma.conversation.upsert({
    where: { id },
    update: {
      encryptedContent: encryptedContentBuffer,
      iv: ivBuffer,
      authTag: authTagBuffer,
    },
    create: {
      id,
      encryptedContent: encryptedContentBuffer,
      iv: ivBuffer,
      authTag: authTagBuffer,
    },
  });

  return NextResponse.json({ id, success: true });
}
