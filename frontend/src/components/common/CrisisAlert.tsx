/**
 * Crisis Alert Component
 * 危机提示组件 - 使用 Tailwind + shadcn/ui
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/components/ui'

interface CrisisAlertOptions {
  riskLevel?: 'orange' | 'red'
  emotionIntensity?: number
}

interface CrisisAlertState {
  open: boolean
  options: CrisisAlertOptions
  onNavigate?: (path: string) => void
}

let crisisAlertState: CrisisAlertState = {
  open: false,
  options: {},
}

let setCrisisAlertState: React.Dispatch<React.SetStateAction<CrisisAlertState>>

/**
 * 危机提示Hook
 * 封装了navigate逻辑，方便在组件中使用
 */
export const useCrisisAlert = () => {
  const navigate = useNavigate()
  const [state, setState] = React.useState<CrisisAlertState>({
    open: false,
    options: {},
    onNavigate: navigate,
  })

  setCrisisAlertState = setState

  const showAlert = (options: CrisisAlertOptions = {}) => {
    // 判断是否需要显示危机提示
    const shouldShow =
      options.riskLevel === 'red' ||
      options.riskLevel === 'orange' ||
      (options.emotionIntensity !== undefined && options.emotionIntensity >= 0.8)

    if (!shouldShow) return

    setState({
      open: true,
      options,
      onNavigate: navigate,
    })
  }

  const handleClose = () => {
    setState(prev => ({ ...prev, open: false }))
  }

  const handleNavigate = () => {
    state.onNavigate?.('/crisis')
    handleClose()
  }

  const CrisisAlertDialog = () => (
    <Dialog open={state.open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>情绪关注</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          我们检测到您可能正在经历强烈的情绪。
        </DialogDescription>
        <p className="text-muted-foreground">
          如果您感到困扰，请随时查看我们的危机支持页面，或拨打心理援助热线。
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>关闭</Button>
          <Button onClick={handleNavigate}>查看危机支持</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return { showAlert, CrisisAlertDialog }
}

/**
 * 显示危机提示弹窗
 */
export const showCrisisAlert = (
  options: CrisisAlertOptions = {},
  navigate?: (path: string) => void
) => {
  const { riskLevel, emotionIntensity } = options

  // 判断是否需要显示危机提示
  const shouldShow =
    riskLevel === 'red' ||
    riskLevel === 'orange' ||
    (emotionIntensity !== undefined && emotionIntensity >= 0.8)

  if (!shouldShow) return

  if (setCrisisAlertState) {
    setCrisisAlertState({
      open: true,
      options,
      onNavigate: navigate,
    })
  }
}

export default { showCrisisAlert, useCrisisAlert }