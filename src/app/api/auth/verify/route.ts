import { NextResponse } from 'next/server'
import * as jose from 'jose'

// Cloud mode only
const isCloudMode = process.env.DEPLOY_MODE !== 'local'

export async function GET(request: Request) {
  // Cloud mode only
  if (!isCloudMode) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)

  try {
    // Verify JWT
    const publicKeyPem = process.env.JWT_PUBLIC_KEY
    if (!publicKeyPem) {
      throw new Error('JWT_PUBLIC_KEY not set')
    }

    const publicKey = await jose.importSPKI(publicKeyPem, 'RS256')
    const { payload } = await jose.jwtVerify(token, publicKey)

    return NextResponse.json({
      user: {
        id: payload.sub,
        emailVerified: true, // In a real implementation, would check from database
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}