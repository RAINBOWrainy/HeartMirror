'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to send reset email')
        setStatus('error')
      }
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--surface)] rounded-lg p-8 border border-[var(--border)]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-[var(--text)] mb-2" style={{ fontFamily: 'Satoshi, sans-serif' }}>HeartMirror</h1>
            <p className="text-[var(--muted)]">Reset your password</p>
          </div>

          {status === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--success)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[var(--text)] mb-2">Check your email</h2>
              <p className="text-[var(--muted)] mb-6">
                If an account exists with this email, we've sent password reset instructions.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-[var(--muted)] mb-6 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {status === 'error' && (
                <div className="bg-[var(--error)]/10 border border-[var(--error)]/50 rounded-lg p-3 text-[var(--error)] text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 px-4 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-[var(--muted)] hover:text-[var(--text)] text-sm transition-colors"
                >
                  Remember your password? Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}