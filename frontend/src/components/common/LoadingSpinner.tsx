/**
 * LoadingSpinner Component
 * 通用加载指示器组件
 */

import React from 'react'
import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large'
  tip?: string
  fullScreen?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  tip,
  fullScreen = false
}) => {
  const indicator = <LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 24 }} spin />

  if (fullScreen) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        background: '#fff'
      }}>
        <Spin indicator={indicator} size={size} tip={tip} />
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '48px 0'
    }}>
      <Spin indicator={indicator} size={size} tip={tip} />
    </div>
  )
}

export default LoadingSpinner