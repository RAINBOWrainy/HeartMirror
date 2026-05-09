'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setError('Invalid reset link. Please request a new password reset.')
    } else {
      setStatus('idle')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setStatus('error')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setStatus('error')
      return
    }

    const token = searchParams.get('token')
    if (!token) {
      setError('Invalid reset link')
      setStatus('error')
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to reset password')
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
            <p className="text-[var(--muted)]">Create new password</p>
          </div>

          {status === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--success)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[var(--text)] mb-2">Password Reset!</h2>
              <p className="text-[var(--muted)] mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <>
              {status === 'error' && (
                <div className="bg-[var(--error)]/10 border border-[var(--error)]/50 rounded-lg p-3 text-[var(--error)] text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--text)] mb-2">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text)] mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading' || !password}
                  className="w-full py-3 px-4 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-[var(--muted)] hover:text-[var(--text)] text-sm transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 px-4">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}