'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Verifying...</h2>
              <p className="text-white/70">Please wait while we verify your email</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
              <p className="text-white/70 mb-6">{message}</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Go to HeartMirror
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-white/70 mb-6">{message}</p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
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