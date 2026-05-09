import { NextResponse } from 'next/server'
import * as jose from 'jose'

// Cloud mode only - return 404 in local mode
const isCloudMode = process.env.DEPLOY_MODE !== 'local'

// Lazy Prisma client for cloud schema
// @ts-ignore - Prisma client with user model only exists in cloud schema (PostgreSQL)
let prisma: any = null
const getPrisma = () => {
  if (!isCloudMode) throw new Error('Cloud mode only')
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client')
    prisma = new PrismaClient()
  }
  return prisma
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const db = getPrisma()

    // Find user with this verification token
    const user = await db.user.findFirst({
      where: { verificationToken: token },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Update user to mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    })

    return NextResponse.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}