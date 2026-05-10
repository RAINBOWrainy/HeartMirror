import { NextResponse } from 'next/server'
import * as jose from 'jose'

// Cloud mode only
const isCloudMode = process.env.DEPLOY_MODE !== 'local'

type UserSettings = {
  apiKey: string
  provider: string
  baseUrl: string
  model: string
}

type PrismaClientType = {
  userSettings: {
    findUnique: (opts: { where: { userId: string } }) => Promise<UserSettings | null>
    upsert: (opts: {
      where: { userId: string }
      create: { userId: string } & UserSettings
      update: Partial<UserSettings>
    }) => Promise<unknown>
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

async function verifyJWT(token: string): Promise<{ userId: string } | null> {
  try {
    const publicKeyPem = process.env.JWT_PUBLIC_KEY
    if (!publicKeyPem) return null

    const publicKey = await jose.importSPKI(publicKeyPem, 'RS256')
    const { payload } = await jose.jwtVerify(token, publicKey)

    return { userId: payload.sub as string }
  } catch {
    return null
  }
}

// GET /api/settings - Get user settings (API key, provider, etc.)
export async function GET(request: Request) {
  if (!isCloudMode) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const payload = await verifyJWT(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const db = getPrisma()
    const settings = await db.userSettings.findUnique({
      where: { userId: payload.userId },
    })

    if (!settings) {
      return NextResponse.json({})
    }

    return NextResponse.json({
      apiKey: settings.apiKey || '',
      provider: settings.provider || 'anthropic',
      baseUrl: settings.baseUrl || '',
      model: settings.model || '',
    })
  } catch (error) {
    console.error('Failed to get settings:', error)
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

// POST /api/settings - Save user settings
export async function POST(request: Request) {
  if (!isCloudMode) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const payload = await verifyJWT(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { apiKey, provider, baseUrl, model } = body

    const db = getPrisma()
    await db.userSettings.upsert({
      where: { userId: payload.userId },
      create: {
        userId: payload.userId,
        apiKey: apiKey || '',
        provider: provider || 'anthropic',
        baseUrl: baseUrl || '',
        model: model || '',
      },
      update: {
        apiKey: apiKey || '',
        provider: provider || 'anthropic',
        baseUrl: baseUrl || '',
        model: model || '',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}