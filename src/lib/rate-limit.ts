/**
 * Rate limiting with Upstash Redis
 * Works with Vercel Edge Functions and Serverless Functions
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Lazy-initialize Redis client to avoid build-time errors
let redis: Redis | null = null

const getRedis = (): Redis => {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
  }
  return redis
}

// Rate limit configurations for different endpoints - lazy initialization
let rateLimitInstances: {
  auth: Ratelimit | null
  chat: Ratelimit | null
  reset: Ratelimit | null
  general: Ratelimit | null
} = { auth: null, chat: null, reset: null, general: null }

const getRateLimits = () => {
  if (!rateLimitInstances.auth) {
    const redisClient = getRedis()
    rateLimitInstances = {
      auth: new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'ratelimit:auth',
      }),
      chat: new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(60, '1 m'),
        analytics: true,
        prefix: 'ratelimit:chat',
      }),
      reset: new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(1, '15 m'),
        analytics: true,
        prefix: 'ratelimit:reset',
      }),
      general: new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'ratelimit:general',
      }),
    }
  }
  return rateLimitInstances
}

// Export as getter
export const rateLimits = {
  get auth() { return getRateLimits().auth! },
  get chat() { return getRateLimits().chat! },
  get reset() { return getRateLimits().reset! },
  get general() { return getRateLimits().general! },
}

/**
 * Get client IP from request headers
 * Handles Vercel, Cloudflare, and nginx proxy headers
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback for local development
  return '127.0.0.1'
}

/**
 * Check rate limit for a given identifier and limiter
 * @param limiter The rate limiter to use
 * @param identifier User ID, IP, or email
 * @returns Success flag and remaining limit info
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  // Skip rate limiting in development or if Redis not configured
  if (
    process.env.NODE_ENV === 'development' ||
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60000,
    }
  }

  try {
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail-open: allow request if Redis is down
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
    }
  }
}

/**
 * Create a rate limit response for blocked requests
 */
export function createRateLimitResponse(reset: number): Response {
  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Reset': reset.toString(),
      'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
    },
  })
}
