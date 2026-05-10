import { NextResponse } from 'next/server'

// Cloud mode only - return 404 in local mode
const isCloudMode = process.env.DEPLOY_MODE !== 'local'

type PrismaClientType = {
  user: {
    findFirst: (opts: { where: { verificationToken: string } }) => Promise<{
      id: string
    } | null>
    update: (opts: { where: { id: string }; data: { emailVerified: true; verificationToken: null } }) => Promise<unknown>
  }
}

// Lazy Prisma client for cloud schema
let prisma: PrismaClientType | null = null
const getPrisma = (): PrismaClientType => {
  if (!isCloudMode) throw new Error('Cloud mode only')
  if (!prisma) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client')
    prisma = new PrismaClient() as PrismaClientType
  }
  return prisma!
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
  } catch (_error) {
    console.error('Verify email error:', _error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}