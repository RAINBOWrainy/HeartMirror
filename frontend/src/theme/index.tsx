/**
 * App Theme Configuration
 * 应用主题配置 - 温暖友好风格
 */

import React from 'react'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

// 品牌色彩系统 - 温暖友好
export const brandColors = {
  // 主色调 - 温暖紫色系
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  // 辅助色
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#6366F1',
  infoLight: '#818CF8',
  // 背景色
  bgWarm: '#FDF8F6',
  bgCard: '#FFFFFF',
  bgLayout: '#FAFAFA',
  // 情绪色彩
  emotionJoy: '#FFD666',
  emotionSadness: '#69C0FF',
  emotionAnger: '#FF7875',
  emotionFear: '#B37FEB',
  emotionAnxiety: '#FFA940',
  emotionCalm: '#95DE64',
}

// 主题配置
export const appTheme = {
  token: {
    // 主色 - 温暖紫色
    colorPrimary: brandColors.primary,
    colorSuccess: brandColors.success,
    colorWarning: brandColors.warning,
    colorError: brandColors.error,
    colorInfo: brandColors.info,
    // 背景色
    colorBgContainer: brandColors.bgCard,
    colorBgLayout: brandColors.bgLayout,
    // 边框圆角 - 更圆润友好
    borderRadius: 16,
    borderRadiusLG: 24,
    borderRadiusSM: 12,
    borderRadiusXS: 8,
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif',
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
    // 阴影 - 更柔和
    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.08)',
    boxShadowSecondary: '0 4px 16px rgba(124, 58, 237, 0.12)',
    // 动画
    motionDurationFast: '0.15s',
    motionDurationMid: '0.25s',
    motionDurationSlow: '0.35s',
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    motionEaseOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    motionEaseIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
  components: {
    Card: {
      borderRadiusLG: 20,
      paddingLG: 24,
      boxShadowTertiary: '0 1px 3px rgba(124, 58, 237, 0.06)',
    },
    Button: {
      borderRadius: 12,
      controlHeight: 44,
      controlHeightLG: 52,
      controlHeightSM: 36,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Input: {
      borderRadius: 12,
      controlHeight: 44,
    },
    Select: {
      borderRadius: 12,
      controlHeight: 44,
    },
    Modal: {
      borderRadiusLG: 20,
    },
    Tag: {
      borderRadiusSM: 10,
    },
    Menu: {
      itemBorderRadius: 12,
      iconSize: 18,
    },
    Message: {
      borderRadiusLG: 12,
    },
    Notification: {
      borderRadiusLG: 12,
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