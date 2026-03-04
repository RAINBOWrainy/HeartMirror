/**
 * App Theme Configuration
 * 应用主题配置
 */

import React from 'react'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

// 主题配置
export const appTheme = {
  token: {
    // 主色
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    // 边框圆角
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    // 间距
    padding: 16,
    paddingLG: 24,
    paddingXS: 8,
    paddingXXS: 4,
    margin: 16,
    marginLG: 24,
    marginXS: 8,
    marginXXS: 4,
    // 阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.12)',
    // 动画
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    motionEaseOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    motionEaseIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
  components: {
    Card: {
      borderRadiusLG: 16,
      paddingLG: 20,
      boxShadowTertiary: '0 1px 2px rgba(0, 0, 0, 0.04)',
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Tag: {
      borderRadiusSM: 8,
    },
    Menu: {
      itemBorderRadius: 8,
      iconSize: 18,
    },
  },
  algorithm: theme.defaultAlgorithm,
}

// 紧凑主题（可选）
export const compactTheme = {
  ...appTheme,
  token: {
    ...appTheme.token,
    fontSize: 13,
    padding: 12,
    margin: 12,
  },
  algorithm: theme.compactAlgorithm,
}

interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * 主题提供者组件
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ConfigProvider theme={appTheme} locale={zhCN}>
      {children}
    </ConfigProvider>
  )
}

export default ThemeProvider