import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // In cloud mode, Prisma RLS automatically restricts to current user's conversations
  // In local mode, all conversations are deleted (single user mode)
  await prisma.conversation.deleteMany({});
  return NextResponse.json({ success: true });
}
