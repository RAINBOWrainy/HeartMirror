'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const redirectTo = searchParams.get('redirect') || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      router.push(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--surface)] rounded-lg p-8 border border-[var(--border)]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-[var(--text)] mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>HeartMirror</h1>
            <p className="text-[var(--muted)]">Welcome back</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-[var(--error)]/10 border border-[var(--error)]/50 rounded-lg p-3 text-[var(--error)] text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text)] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[var(--accent)] text-white font-medium rounded hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/signup"
              className="text-[var(--muted)] hover:text-[var(--text)] text-sm transition-colors"
            >
              Don't have an account? Sign up
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-[var(--muted)] hover:text-[var(--text)] text-sm transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-[var(--muted)] hover:text-[var(--text)] text-sm transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}