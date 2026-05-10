/**
 * Cloud mode auth endpoint
 * Returns 404 in local mode (auth not needed - no user accounts)
 */
import { NextResponse } from 'next/server'
import * as jose from 'jose'
import { Resend } from 'resend'
import crypto from 'crypto'
import {
  rateLimits,
  getClientIP,
  checkRateLimit,
  createRateLimitResponse,
} from '@/lib/rate-limit'

// Cloud mode only - return 404 in local mode
const isCloudMode = process.env.DEPLOY_MODE !== 'local'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
// Lazy Prisma client - only used in cloud mode with cloud schema
let prismaClient: any = null
const getPrisma = () => {
  if (!isCloudMode) throw new Error('Cloud mode only')
  if (!prismaClient) {
    const { PrismaClient } = require('@prisma/client')
    prismaClient = new PrismaClient()
  }
  return prismaClient
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// Lazy-initialize Resend client only in cloud mode
let resendClient: Resend | null = null
const getResend = (): Resend => {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY || '')
  }
  return resendClient
}

const JWT_EXPIRY = '7d'
const PBKDF2_ITERATIONS = 600000
const SALT_LENGTH = 32

// Generate salt for client-side PBKDF2
function generateSalt(): Buffer {
  return crypto.randomBytes(SALT_LENGTH)
}

// Generate random Data Encryption Key
function _generateDEK(): Buffer {
  return crypto.randomBytes(32) // 256-bit key
}

// Generate password verifier blob for timing-safe verification
function _createPasswordVerifier(derivedKey: Buffer): {
  encrypted: Buffer
  expectedHash: Buffer
  iv: Buffer
  tag: Buffer
} {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey.slice(0, 32), iv)
  const knownPlaintext = Buffer.from('heartmirror-verification')
  let ciphertext = cipher.update(knownPlaintext)
  ciphertext = Buffer.concat([ciphertext, cipher.final()])
  const tag = cipher.getAuthTag()

  return {
    encrypted: ciphertext,
    expectedHash: derivedKey.slice(0, 16),
    iv,
    tag,
  }
}

async function signJWT(userId: string): Promise<string> {
  const privateKeyPem = process.env.JWT_PRIVATE_KEY
  if (!privateKeyPem) {
    throw new Error('JWT_PRIVATE_KEY not set')
  }

  const privateKey = await jose.importPKCS8(privateKeyPem, 'RS256')

  return new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(privateKey)
}

// POST /api/auth/[action]
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  // Cloud mode only
  if (!isCloudMode) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { action } = await params
  const clientIP = getClientIP(request)

  try {
    // Apply rate limits per endpoint
    switch (action) {
      case 'signup':
      case 'login': {
        const rateLimitResult = await checkRateLimit(rateLimits.auth, clientIP)
        if (!rateLimitResult.success) {
          return createRateLimitResponse(rateLimitResult.reset)
        }
        return handleSignup(await request.json())
      }
      case 'forgot-password': {
        const body = await request.json()
        const email = (body.email || 'unknown').toLowerCase()
        const rateLimitResult = await checkRateLimit(rateLimits.reset, email)
        if (!rateLimitResult.success) {
          return createRateLimitResponse(rateLimitResult.reset)
        }
        return handleForgotPassword(body)
      }
      case 'reset-password': {
        const rateLimitResult = await checkRateLimit(rateLimits.reset, clientIP)
        if (!rateLimitResult.success) {
          return createRateLimitResponse(rateLimitResult.reset)
        }
        return handleResetPassword(await request.json())
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (_error) {
    console.error('Auth error:', _error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

async function handleSignup(body: {
  email: string
  // All crypto happens client-side - server only sees:
  encryptedDek: string // base64 encoded
  dekSalt: string // base64 encoded
  dekIv: string // base64 encoded
  dekAuthTag: string // base64 encoded
  passwordVerifier: string // base64 encoded
  salt: string // base64 encoded
}) {
  const { email, encryptedDek, dekSalt, dekIv, dekAuthTag, passwordVerifier, salt } = body

  if (!email || !encryptedDek || !dekSalt || !dekIv || !dekAuthTag || !passwordVerifier || !salt) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Check if user already exists
  const existingUser = await getPrisma().user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (existingUser) {
    // Return same generic message to prevent email enumeration
    return NextResponse.json(
      { error: 'If this email exists, a verification link has been sent' },
      { status: 200 }
    )
  }

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex')

  // Create user
  const user = await getPrisma().user.create({
    data: {
      email: email.toLowerCase(),
      encryptedDek: Buffer.from(encryptedDek, 'base64'),
      dekSalt: Buffer.from(dekSalt, 'base64'),
      dekIv: Buffer.from(dekIv, 'base64'),
      dekAuthTag: Buffer.from(dekAuthTag, 'base64'),
      passwordVerifier: Buffer.from(passwordVerifier, 'base64'),
      salt: Buffer.from(salt, 'base64'),
      verificationToken,
    },
  })

  // Send verification email
  if (process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production') {
    try {
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/verify?token=${verificationToken}`

      await getResend().emails.send({
        from: 'HeartMirror <noreply@heartmirror.app>',
        to: [email],
        subject: 'Verify your HeartMirror account',
        html: `
          <h1>Welcome to HeartMirror</h1>
          <p>Click the link below to verify your email:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail signup if email fails - user can resend
    }
  }

  // Issue JWT
  const token = await signJWT(user.id)

  return NextResponse.json({
    token,
    userId: user.id,
    emailVerified: user.emailVerified,
  })
}

async function _handleLogin(body: {
  email: string
  // Client sends derived key hash + verification data
  derivedKeyHash: string // base64 encoded first 16 bytes of KEK
  encryptedDek: string // base64 encoded DEK container
  dekIv: string // base64 encoded
  dekAuthTag: string // base64 encoded
}) {
  const { email, derivedKeyHash, encryptedDek, dekIv, dekAuthTag } = body

  if (!email || !derivedKeyHash || !encryptedDek || !dekIv || !dekAuthTag) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Get user
  const user = await getPrisma().user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) {
    // Timing-safe dummy verification to prevent timing attacks
    // that could leak whether an email exists
    crypto.timingSafeEqual(Buffer.alloc(16), Buffer.alloc(16))
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  // Timing-safe comparison of derived key hash
  const expectedHash = user.passwordVerifier.subarray(0, 16)
  const providedHash = Buffer.from(derivedKeyHash, 'base64')

  // Pad to same length for timing safety
  const maxLen = Math.max(expectedHash.length, providedHash.length)
  const paddedExpected = Buffer.concat([expectedHash, Buffer.alloc(maxLen - expectedHash.length)])
  const paddedProvided = Buffer.concat([providedHash, Buffer.alloc(maxLen - providedHash.length)])

  const hashMatch = crypto.timingSafeEqual(paddedExpected, paddedProvided)

  if (!hashMatch) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  // Update last login
  await getPrisma().user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

  // Issue JWT
  const token = await signJWT(user.id)

  return NextResponse.json({
    token,
    userId: user.id,
    emailVerified: user.emailVerified,
    // Return salt for client-side key derivation cache
    salt: user.salt.toString('base64'),
  })
}

async function handleForgotPassword(body: { email: string }) {
  const { email } = body

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const user = await getPrisma().user.findUnique({
    where: { email: email.toLowerCase() },
  })

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({
      message: 'If this email exists, a reset link has been sent',
    })
  }

  // Generate reset token (1 hour expiry)
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiry = new Date(Date.now() + 3600000)

  await getPrisma().user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  })

  // Send reset email
  if (process.env.RESEND_API_KEY && process.env.NODE_ENV === 'production') {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/reset-password?token=${resetToken}`

      await getResend().emails.send({
        from: 'HeartMirror <noreply@heartmirror.app>',
        to: [email],
        subject: 'Reset your HeartMirror password',
        html: `
          <h1>Reset Your Password</h1>
          <p>Click the link below to reset your password:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError)
    }
  }

  return NextResponse.json({
    message: 'If this email exists, a reset link has been sent',
  })
}

async function handleResetPassword(body: {
  token: string
  encryptedDek: string
  dekSalt: string
  dekIv: string
  dekAuthTag: string
  passwordVerifier: string
}) {
  const { token, encryptedDek, dekSalt, dekIv, dekAuthTag, passwordVerifier } = body

  if (!token || !encryptedDek || !dekSalt || !dekIv || !dekAuthTag || !passwordVerifier) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Find user with valid token
  const user = await getPrisma().user.findFirst({
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

  // Update user with new DEK container and password verifier
  await getPrisma().user.update({
    where: { id: user.id },
    data: {
      encryptedDek: Buffer.from(encryptedDek, 'base64'),
      dekSalt: Buffer.from(dekSalt, 'base64'),
      dekIv: Buffer.from(dekIv, 'base64'),
      dekAuthTag: Buffer.from(dekAuthTag, 'base64'),
      passwordVerifier: Buffer.from(passwordVerifier, 'base64'),
      resetToken: null, // Invalidate token
      resetTokenExpiry: null,
    },
  })

  return NextResponse.json({ message: 'Password reset successfully' })
}

// GET /api/auth/salt - Get salt for client-side PBKDF2
export async function GET(request: Request) {
  // Cloud mode only
  if (!isCloudMode) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    // Return random salt for new users
    const salt = generateSalt()
    return NextResponse.json({
      salt: salt.toString('base64'),
      iterations: PBKDF2_ITERATIONS,
    })
  }

  // Return existing user's salt
  const user = await getPrisma().user.findUnique({
    where: { email: email.toLowerCase() },
    select: { salt: true },
  })

  if (!user) {
    // Return dummy salt to prevent email enumeration timing attacks
    const dummySalt = generateSalt()
    return NextResponse.json({
      salt: dummySalt.toString('base64'),
      iterations: PBKDF2_ITERATIONS,
    })
  }

  return NextResponse.json({
    salt: user.salt.toString('base64'),
    iterations: PBKDF2_ITERATIONS,
  })
}
