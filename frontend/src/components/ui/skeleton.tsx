import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, rows = 1, ...props }, ref) => {
    if (rows > 1) {
      return (
        <div className="space-y-2" ref={ref} {...props}>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-4 animate-pulse rounded-md bg-muted',
                i === rows - 1 && 'w-2/3',
                className
              )}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn('animate-pulse rounded-md bg-muted', className)}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

// Skeleton Card for loading states
const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('rounded-lg border border-border bg-surface p-6 space-y-4', className)}>
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton rows={2} />
  </div>
)

export { Skeleton, SkeletonCard }