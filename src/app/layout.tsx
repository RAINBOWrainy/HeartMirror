import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HeartMirror — 2AM Companion',
  description: "A private, judgment-free space for when you're spiraling at 2AM.",
  manifest: '/manifest.json',
  themeColor: '#020617',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
