/**
 * ErrorBoundary Component
 * React 错误边界组件 - 使用 Tailwind + shadcn/ui
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button, Card } from '@/components/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    // 可以在这里记录错误到日志服务
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <div className="flex justify-center items-center min-h-screen p-6 bg-base">
          <Card className="p-10 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
              页面出错了
            </h2>
            <p className="text-muted-foreground mb-6">
              {error?.message || '抱歉，页面遇到了一些问题'}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={this.handleReset}>
                重试
              </Button>
              <Button variant="outline" onClick={this.handleReload}>
                刷新页面
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return children
  }
}

export default ErrorBoundary