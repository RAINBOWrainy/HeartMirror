'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')

    const verifyEmail = async () => {
      if (!token) {
        // No token - show message for users who just signed up
        if (isAuthenticated && user?.emailVerified === false) {
          setStatus('success')
          setMessage('Verification email sent! Please check your inbox and click the verification link.')
        } else {
          setStatus('error')
          setMessage('Invalid verification link.')
        }
        return
      }

      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (res.ok) {
          setStatus('success')
          setMessage('Email verified successfully! You can now use all features.')
        } else {
          const data = await res.json()
          setStatus('error')
          setMessage(data.error || 'Verification failed.')
        }
      } catch {
        setStatus('error')
        setMessage('Verification failed. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams, isAuthenticated, user])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--surface)] rounded-lg p-8 border border-[var(--border)] text-center">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-semibold text-[var(--text)] mb-2">Verifying...</h2>
              <p className="text-[var(--muted)]">Please wait while we verify your email</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-[var(--success)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text)] mb-2">Success!</h2>
              <p className="text-[var(--muted)] mb-6">{message}</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
              >
                Go to HeartMirror
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-[var(--error)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text)] mb-2">Verification Failed</h2>
              <p className="text-[var(--muted)] mb-6">{message}</p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-[var(--surface)] text-[var(--text)] font-medium rounded-lg hover:bg-[var(--border)] transition-colors border border-[var(--border)]"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}