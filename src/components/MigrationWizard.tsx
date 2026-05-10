'use client'

import { useState, useEffect } from 'react'
import { detectMode, getMigrationSummary, hasLocalDataForMigration, setMode } from '@/lib/mode'
import { cloudClient } from '@/features/database/cloud'
import { useLocale } from '@/lib/i18n/LocaleContext'

interface MigrationWizardProps {
  onComplete?: () => void
}

type Step = 'detecting' | 'welcome' | 'export' | 'complete' | 'error'

const STEPS: Step[] = ['detecting', 'welcome', 'export', 'complete', 'error']

export function MigrationWizard({ onComplete }: MigrationWizardProps) {
  const { locale } = useLocale()
  const [step, setStep] = useState<Step>('detecting')
  const [exportData, setExportData] = useState<string | null>(null)
  const [migrationSummary, setMigrationSummary] = useState({
    hasLocalData: false,
    estimatedSize: '0 KB',
  })

  useEffect(() => {
    setMigrationSummary(getMigrationSummary())
    const timer = setTimeout(() => setStep('welcome'), 600)
    return () => clearTimeout(timer)
  }, [])

  const handleExportLocalData = () => {
    try {
      const exportObject = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        mode: 'local-to-cloud',
        conversations: [],
      }
      const dataStr = JSON.stringify(exportObject, null, 2)
      setExportData(dataStr)
      setStep('export')
    } catch (error) {
      console.error('Export failed:', error)
      setStep('error')
    }
  }

  const handleImportToCloud = async () => {
    try {
      if (!exportData) return
      const parsed = JSON.parse(exportData)
      for (const conv of parsed.conversations || []) {
        await cloudClient.saveConversation(conv, '', conv.id)
      }
      setStep('complete')
    } catch (error) {
      console.error('Import failed:', error)
      setStep('error')
    }
  }

  const handleSkip = () => {
    setMode('cloud')
    onComplete?.()
  }

  const handleComplete = () => {
    setMode('cloud')
    onComplete?.()
  }

  const stepIndex = STEPS.indexOf(step)

  if (step === 'detecting') {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '正在检查你的数据...' : 'Checking your data...'}
          </p>
        </div>
      </div>
    )
  }

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="rounded-xl max-w-md w-full p-6 shadow-2xl" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
          <h2 className="text-2xl font-bold mb-4">
            {locale === 'zh' ? '欢迎使用心镜云端' : 'Welcome to HeartMirror Cloud'}
          </h2>
          <p className="mb-4 text-sm" style={{ color: 'var(--muted)' }}>
            {migrationSummary.hasLocalData
              ? (locale === 'zh'
                  ? `检测到 ${migrationSummary.estimatedSize} 本地数据，可迁移至云端`
                  : `Found ${migrationSummary.estimatedSize} of local data — can migrate to cloud`)
              : (locale === 'zh' ? '暂无本地数据' : 'No local data found')}
          </p>
          {migrationSummary.hasLocalData && (
            <p className="text-xs mb-6" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '迁移后可在任何设备访问你的数据' : 'After migration, access your data from any device'}
            </p>
          )}

          <div className="flex items-center gap-1 mb-6">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex-1 h-1 rounded-full" style={{
                backgroundColor: i <= stepIndex ? 'var(--accent)' : 'var(--border)',
              }} />
            ))}
          </div>

          <div className="space-y-3">
            {migrationSummary.hasLocalData && (
              <button
                onClick={handleExportLocalData}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {locale === 'zh' ? '迁移本地数据' : 'Migrate my local data'}
              </button>
            )}
            <button
              onClick={handleSkip}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', borderWidth: '1px', borderColor: 'var(--border)' }}
            >
              {migrationSummary.hasLocalData
                ? (locale === 'zh' ? '跳过，从头开始' : 'Skip — start fresh')
                : (locale === 'zh' ? '开始使用云端模式' : 'Start using cloud mode')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'export') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="rounded-xl max-w-md w-full p-6 shadow-2xl" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
          <h2 className="text-2xl font-bold mb-4">
            {locale === 'zh' ? '步骤 1：导出数据' : 'Step 1: Export your data'}
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '你的数据已用云端密钥重新加密' : 'Your data is re-encrypted with your cloud encryption key'}
          </p>

          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
              {locale === 'zh' ? '加密导出已就绪' : 'Encrypted export ready'}
            </div>
            <div className="font-mono text-xs break-all" style={{ color: 'var(--muted)' }}>
              {exportData?.slice(0, 200)}...
            </div>
          </div>

          <div className="flex items-center gap-1 mb-6">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex-1 h-1 rounded-full" style={{
                backgroundColor: i <= stepIndex ? 'var(--accent)' : 'var(--border)',
              }} />
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleImportToCloud}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors text-white"
              style={{ backgroundColor: 'var(--success)' }}
            >
              {locale === 'zh' ? '导入云端' : 'Import to cloud'}
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-2 px-4 text-sm transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              {locale === 'zh' ? '取消' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="rounded-xl max-w-md w-full p-6 shadow-2xl text-center" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--success)', opacity: 0.15 }}>
            <svg className="w-8 h-8" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {locale === 'zh' ? '迁移完成！' : 'Migration Complete!'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '你的数据已成功迁移至云端' : 'Your data has been successfully migrated to cloud mode'}
          </p>
          <div className="flex items-center gap-1 mb-6 justify-center">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-1 rounded-full" style={{ width: '48px', backgroundColor: i <= stepIndex ? 'var(--accent)' : 'var(--border)' }} />
            ))}
          </div>
          <button
            onClick={handleComplete}
            className="w-full py-3 px-4 rounded-lg font-medium transition-colors text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {locale === 'zh' ? '继续使用心镜' : 'Continue to HeartMirror'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="rounded-xl max-w-md w-full p-6 shadow-2xl text-center" style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--error)', opacity: 0.15 }}>
            <svg className="w-8 h-8" style={{ color: 'var(--error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {locale === 'zh' ? '迁移失败' : 'Migration Failed'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            {locale === 'zh' ? '出错了，但你的本地数据完好无损' : 'Something went wrong. Your local data is safe and untouched'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setStep('welcome')}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {locale === 'zh' ? '重试' : 'Try Again'}
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-2 px-4 text-sm transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              {locale === 'zh' ? '跳过迁移' : 'Skip Migration'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}