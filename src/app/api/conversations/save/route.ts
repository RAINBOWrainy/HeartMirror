import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { id, encryptedContent, iv, authTag, salt, type } = body;

  const encryptedContentBuffer = Buffer.from(encryptedContent, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const authTagBuffer = Buffer.from(authTag, 'base64');
  const saltBuffer = salt ? Buffer.from(salt, 'base64') : Buffer.alloc(0);
  const conversationType = type === 'assessment' ? 'assessment' : 'chat';

  // Cloud mode: userId from JWT middleware sets RLS context
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Set RLS context for this transaction
  await prisma.$executeRaw`SET app.current_user_id = ${userId}`;

  await prisma.conversation.upsert({
    where: { id },
    update: {
      encryptedContent: encryptedContentBuffer,
      iv: ivBuffer,
      authTag: authTagBuffer,
      salt: saltBuffer,
      type: conversationType,
    },
    create: {
      id,
      userId,
      encryptedContent: encryptedContentBuffer,
      iv: ivBuffer,
      authTag: authTagBuffer,
      salt: saltBuffer,
      type: conversationType,
    },
  });

  await prisma.$executeRaw`RESET app.current_user_id`;

  return NextResponse.json({ id, success: true });
}
