import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const filename = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: filename });
const prisma = new PrismaClient({ adapter });

export async function POST() {
  await prisma.conversation.deleteMany({});
  return NextResponse.json({ success: true });
}
