/**
 * GuestModeBanner Component
 * 访客模式横幅 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import { Info } from 'lucide-react'
import { Alert } from '@/components/ui'

interface GuestModeBannerProps {
  guestExpiresAt?: string
}

const GuestModeBanner: React.FC<GuestModeBannerProps> = ({ guestExpiresAt }) => {
  // 计算剩余时间
  const getRemainingTime = () => {
    if (!guestExpiresAt) return '24小时'

    const expires = new Date(guestExpiresAt)
    const now = new Date()
    const diffMs = expires.getTime() - now.getTime()

    if (diffMs <= 0) return '已过期'

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  return (
    <Alert variant="info" className="mb-4">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 shrink-0" />
        <span className="font-medium text-foreground">欢迎使用心镜</span>
        <span className="text-muted-foreground">会话有效期: {getRemainingTime()}</span>
      </div>
    </Alert>
  )
}

export default GuestModeBanner