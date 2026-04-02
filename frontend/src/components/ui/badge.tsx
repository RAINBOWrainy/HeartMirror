import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary-dark',
        primary: 'bg-primary text-white',
        secondary: 'bg-muted text-muted-foreground',
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-warning',
        error: 'bg-error-soft text-error',
        outline: 'border border-border text-foreground',
        // Emotion variants
        joy: 'bg-joy-soft text-joy',
        sadness: 'bg-sadness-soft text-sadness',
        anger: 'bg-anger-soft text-anger',
        anxiety: 'bg-anxiety-soft text-anxiety',
        fear: 'bg-fear-soft text-fear',
        calm: 'bg-calm-soft text-calm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }