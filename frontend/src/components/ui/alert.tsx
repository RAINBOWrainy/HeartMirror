import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-sm',
  {
    variants: {
      variant: {
        default: 'bg-surface text-foreground border-border',
        info: 'bg-info-soft text-foreground border-info',
        success: 'bg-success-soft text-foreground border-success',
        warning: 'bg-warning-soft text-foreground border-warning',
        destructive: 'bg-error-soft text-foreground border-error',
        error: 'bg-error-soft text-foreground border-error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const alertIcons = {
  default: Info,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  destructive: AlertCircle,
  error: AlertCircle,
}

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  icon?: boolean
  title?: string
  description?: string
  onClose?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', icon = true, title, description, onClose, children, ...props }, ref) => {
    const Icon = alertIcons[variant || 'default']

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="flex gap-3">
          {icon && <Icon className="h-5 w-5 shrink-0 mt-0.5" />}
          <div className="flex-1">
            {title && (
              <h5 className="font-medium mb-1">{title}</h5>
            )}
            {description && (
              <p className="text-sm opacity-90">{description}</p>
            )}
            {children}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
Alert.displayName = 'Alert'

export { Alert }