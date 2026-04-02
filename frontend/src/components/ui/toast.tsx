// Toast notification system using Sonner-like approach
import * as React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, description?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const toastStyles = {
  success: 'bg-success-soft border-success text-success',
  error: 'bg-error-soft border-error text-error',
  warning: 'bg-warning-soft border-warning text-warning',
  info: 'bg-info-soft border-info text-info',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((type: ToastType, message: string, description?: string) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, type, message, description }])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const context = React.useContext(ToastContext)
  if (!context) return null

  const { toasts, removeToast } = context

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border shadow-elevated animate-slide-up',
              'bg-surface',
              toastStyles[toast.type]
            )}
            role="alert"
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{toast.message}</p>
              {toast.description && (
                <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return {
    success: (message: string, description?: string) => context.addToast('success', message, description),
    error: (message: string, description?: string) => context.addToast('error', message, description),
    warning: (message: string, description?: string) => context.addToast('warning', message, description),
    info: (message: string, description?: string) => context.addToast('info', message, description),
  }
}

// Standalone message API (similar to Ant Design's message)
export const message = {
  success: (content: string) => {
    // This is a simplified version. In production, you'd use a global state manager
    console.log('[Toast Success]', content)
  },
  error: (content: string) => {
    console.log('[Toast Error]', content)
  },
  warning: (content: string) => {
    console.log('[Toast Warning]', content)
  },
  info: (content: string) => {
    console.log('[Toast Info]', content)
  },
}