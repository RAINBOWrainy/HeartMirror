import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  await prisma.conversation.deleteMany({});
  return NextResponse.json({ success: true });
}
