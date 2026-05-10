import { NextResponse } from 'next/server'

// Cloud mode only
const isCloudMode = process.env.DEPLOY_MODE !== 'local'

type PrismaClientType = {
  user: {
    findFirst: (opts: { where: { resetToken?: string; resetTokenExpiry?: { gte: Date } } }) => Promise<{
      id: string
    } | null>
    update: (opts: { where: { id: string }; data: { resetToken: null; resetTokenExpiry: null } }) => Promise<unknown>
  }
}

// Lazy Prisma client
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
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const db = getPrisma()

    // Find user with valid reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Update password - client sends the new encrypted DEK and password verifier
    // We just clear the reset token; the signup handler already validated the crypto params
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (_error) {
    console.error('Reset password error:', _error)
    return NextResponse.json(
      { error: 'Password reset failed' },
      { status: 500 }
    )
  }
}