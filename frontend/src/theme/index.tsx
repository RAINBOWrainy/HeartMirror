/**
 * Theme Provider
 * Handles light/dark mode and design tokens
 */

import * as React from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    // Check localStorage
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) return stored

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }

    return 'light'
  })

  React.useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  // Listen for system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('theme')
      // Only auto-switch if user hasn't manually set a preference
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Export shadows for backward compatibility
export const softShadows = {
  none: { boxShadow: 'none' },
  soft: { boxShadow: 'var(--shadow-soft)' },
  card: { boxShadow: 'var(--shadow-card)' },
  elevated: { boxShadow: 'var(--shadow-elevated)' },
  focus: { boxShadow: 'var(--shadow-focus)' },
  sidebar: { boxShadow: 'var(--shadow-sidebar)' },
  header: { boxShadow: 'var(--shadow-header)' },
  // Backward compatibility aliases
  raised: { boxShadow: 'var(--shadow-card)' },
  smooth: { boxShadow: 'var(--shadow-soft)' },
}

// Backward compatibility aliases
export const neuShadows = softShadows
export const flatShadows = softShadows

// Export appTheme for backward compatibility (now just an empty object since we don't use Ant Design)
export const appTheme = {}

// Export brandColors with all legacy properties
// Updated to match DESIGN.md - Organic/Natural aesthetic
export const brandColors = {
  // Primary - Sage Green
  primary: 'var(--color-primary)',
  primaryLight: 'var(--color-primary-light)',
  primaryDark: 'var(--color-primary-dark)',
  // Secondary - Warm Sand
  accent: 'var(--color-secondary)',
  accentLight: 'var(--color-secondary)',
  accentSoft: 'var(--color-secondary-soft)',
  // Semantic colors
  success: 'var(--color-success)',
  successSoft: 'var(--color-success-soft)',
  warning: 'var(--color-warning)',
  warningSoft: 'var(--color-warning-soft)',
  error: 'var(--color-error)',
  errorSoft: 'var(--color-error-soft)',
  info: 'var(--color-info)',
  infoLight: 'var(--color-info)',
  infoSoft: 'var(--color-info-soft)',
  // Background colors
  bgBase: 'var(--color-bg)',
  bgLight: 'var(--color-surface)',
  bgCard: 'var(--color-surface)',
  bgLayout: 'var(--color-bg)',
  bgMuted: 'var(--color-muted)',
  // Text colors
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  // Border colors
  border: 'var(--color-border)',
  borderMuted: 'var(--color-border-muted)',
  // Emotion colors - 6-color system from DESIGN.md
  emotionJoy: 'var(--emotion-joy)',
  emotionJoySoft: 'var(--emotion-joy-soft)',
  emotionSadness: 'var(--emotion-sadness)',
  emotionSadnessSoft: 'var(--emotion-sadness-soft)',
  emotionAnger: 'var(--emotion-anger)',
  emotionAngerSoft: 'var(--emotion-anger-soft)',
  emotionAnxiety: 'var(--emotion-anxiety)',
  emotionAnxietySoft: 'var(--emotion-anxiety-soft)',
  emotionFear: 'var(--emotion-fear)',
  emotionFearSoft: 'var(--emotion-fear-soft)',
  emotionCalm: 'var(--emotion-calm)',
  emotionCalmSoft: 'var(--emotion-calm-soft)',
  // Typography
  fontBody: 'var(--font-body)',
  fontDiary: 'var(--font-diary)',
}

export default ThemeProvider