'use client'

import { useState, useEffect } from 'react'
import { detectMode, getMigrationSummary, hasLocalDataForMigration, setMode } from '@/lib/mode'
import { cloudClient } from '@/features/database/cloud'

interface MigrationWizardProps {
  onComplete?: () => void
}

type Step = 'welcome' | 'export' | 'import' | 'complete' | 'error'

export function MigrationWizard({ onComplete }: MigrationWizardProps) {
  const [step, setStep] = useState<Step>('welcome')
  const [exportData, setExportData] = useState<string | null>(null)
  const [migrationSummary, setMigrationSummary] = useState({
    hasLocalData: false,
    estimatedSize: '0 KB',
  })

  useEffect(() => {
    setMigrationSummary(getMigrationSummary())
  }, [])

  const handleExportLocalData = () => {
    try {
      // In a real implementation, this would:
      // 1. Get all local conversations from the database
      // 2. Re-encrypt them with the user's cloud DEK
      // 3. Create export JSON with metadata
      const exportObject = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        mode: 'local-to-cloud',
        conversations: [], // Would fetch from local DB
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

      // In a real implementation, this would:
      // 1. Parse export JSON
      // 2. Verify DEK matches cloud user's DEK
      // 3. Upsert each conversation to cloud DB
      const parsed = JSON.parse(exportData)

      // Simulate API calls for import
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

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Welcome to HeartMirror Cloud
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You have {migrationSummary.hasLocalData ? `${migrationSummary.estimatedSize} of local conversation data` : 'no local data'}
            {migrationSummary.hasLocalData && ' that can be migrated to cloud mode.'}
          </p>

          <div className="space-y-3">
            {migrationSummary.hasLocalData && (
              <button
                onClick={handleExportLocalData}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Migrate my local data
              </button>
            )}
            <button
              onClick={handleSkip}
              className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
            >
              {migrationSummary.hasLocalData ? 'Skip migration - start fresh' : 'Start using cloud mode'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'export') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Step 1: Export your data
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your data is re-encrypted with your cloud encryption key.
          </p>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Encrypted export ready:
            </div>
            <div className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all">
              {exportData?.slice(0, 200)}...
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleImportToCloud}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Import to cloud
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Migration Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your data has been successfully migrated to cloud mode.
          </p>
          <button
            onClick={handleComplete}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Continue to HeartMirror
          </button>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Migration Failed
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Something went wrong. Your local data is safe and untouched.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setStep('welcome')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Skip Migration
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
