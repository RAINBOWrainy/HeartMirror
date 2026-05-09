import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { id, encryptedContent, iv, authTag } = body;

  const encryptedContentBuffer = Buffer.from(encryptedContent, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');
  const authTagBuffer = Buffer.from(authTag, 'base64');

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
    },
    create: {
      id,
      userId,
      encryptedContent: encryptedContentBuffer,
      iv: ivBuffer,
      authTag: authTagBuffer,
    },
  });

  await prisma.$executeRaw`RESET app.current_user_id`;

  return NextResponse.json({ id, success: true });
}
