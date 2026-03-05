/**
 * Crisis Alert Component
 * 危机提示组件 - 用于高风险情绪检测时显示警告
 */

import React from 'react'
import { Modal, Typography, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Paragraph } = Typography

interface CrisisAlertOptions {
  riskLevel?: 'orange' | 'red'
  emotionIntensity?: number
}

/**
 * 显示危机提示弹窗
 * @param options 配置选项
 * @param navigate 导航函数（可选，用于测试）
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

  Modal.warning({
    title: '情绪关注',
    content: (
      <div>
        <Paragraph>我们检测到您可能正在经历强烈的情绪。</Paragraph>
        <Paragraph>如果您感到困扰，请随时查看我们的危机支持页面，或拨打心理援助热线。</Paragraph>
        <Button
          type="primary"
          onClick={() => {
            Modal.destroyAll()
            if (navigate) {
              navigate('/crisis')
            }
          }}
        >
          查看危机支持
        </Button>
      </div>
    ),
  })
}

/**
 * 危机提示Hook
 * 封装了navigate逻辑，方便在组件中使用
 */
export const useCrisisAlert = () => {
  const navigate = useNavigate()

  const showAlert = (options: CrisisAlertOptions = {}) => {
    showCrisisAlert(options, navigate)
  }

  return { showAlert }
}

export default { showCrisisAlert, useCrisisAlert }