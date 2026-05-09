import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/manifest.json',
  '/sw.js',
]

// Routes that only apply to cloud mode
const CLOUD_ONLY_ROUTES = ['/api/auth']

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => path.startsWith(route))
}

function isCloudMode(): boolean {
  return process.env.DEPLOY_MODE === 'cloud'
}

async function verifyJWT(token: string): Promise<{ userId: string } | null> {
  try {
    const publicKeyPem = process.env.JWT_PUBLIC_KEY
    if (!publicKeyPem) {
      console.error('JWT_PUBLIC_KEY not set')
      return null
    }

    const publicKey = await jose.importSPKI(publicKeyPem, 'RS256')
    const { payload } = await jose.jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
    })

    if (!payload.sub) {
      return null
    }

    return { userId: payload.sub }
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Local mode: no auth required - encryption handled client-side
  if (!isCloudMode()) {
    // Block cloud-only auth routes in local mode
    if (CLOUD_ONLY_ROUTES.some(route => path.startsWith(route))) {
      return NextResponse.json(
        { error: 'Cloud mode required for this feature' },
        { status: 400 }
      )
    }
    return NextResponse.next()
  }

  // Cloud mode: public routes pass through
  if (isPublicRoute(path)) {
    return NextResponse.next()
  }

  // Cloud mode: protected routes require JWT
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const payload = await verifyJWT(token)
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  // Set current user ID for RLS in downstream handlers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/api/:path*',
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
