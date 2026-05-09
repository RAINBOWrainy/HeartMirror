import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    select: {
      encryptedContent: true,
      iv: true,
      authTag: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Server sends encrypted bytes as base64 to client
  // Client handles decryption with DEK stored in memory
  return NextResponse.json({
    encryptedContent: Buffer.from(conversation.encryptedContent).toString('base64'),
    iv: Buffer.from(conversation.iv).toString('base64'),
    authTag: Buffer.from(conversation.authTag).toString('base64'),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.conversation.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
