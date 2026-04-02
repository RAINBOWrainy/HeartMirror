import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Noto Sans SC', 'sans-serif'],
        body: ['Noto Sans SC', 'sans-serif'],
        diary: ['Noto Sans SC', 'sans-serif'],
      },
      colors: {
        // Primary - Sage Green (trust, growth, healing)
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        // Secondary - Warm Sand (warmth, comfort)
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          soft: 'var(--color-secondary-soft)',
        },
        // Accent - Same as primary
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-accent-light)',
          soft: 'var(--color-accent-soft)',
        },
        // Semantic colors
        success: {
          DEFAULT: 'var(--color-success)',
          soft: 'var(--color-success-soft)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          soft: 'var(--color-warning-soft)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          soft: 'var(--color-error-soft)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          soft: 'var(--color-info-soft)',
        },
        // Background & Surface
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        muted: 'var(--color-muted)',
        // Text
        foreground: 'var(--text-primary)',
        'muted-foreground': 'var(--text-secondary)',
        // Border
        border: 'var(--color-border)',
        'border-muted': 'var(--color-border-muted)',
        // Emotion colors
        joy: {
          DEFAULT: 'var(--emotion-joy)',
          soft: 'var(--emotion-joy-soft)',
        },
        sadness: {
          DEFAULT: 'var(--emotion-sadness)',
          soft: 'var(--emotion-sadness-soft)',
        },
        anger: {
          DEFAULT: 'var(--emotion-anger)',
          soft: 'var(--emotion-anger-soft)',
        },
        anxiety: {
          DEFAULT: 'var(--emotion-anxiety)',
          soft: 'var(--emotion-anxiety-soft)',
        },
        fear: {
          DEFAULT: 'var(--emotion-fear)',
          soft: 'var(--emotion-fear-soft)',
        },
        calm: {
          DEFAULT: 'var(--emotion-calm)',
          soft: 'var(--emotion-calm-soft)',
        },
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '11': 'var(--space-11)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-xl)',
        '3xl': 'var(--radius-xl)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        focus: 'var(--shadow-focus)',
        sidebar: 'var(--shadow-sidebar)',
        header: 'var(--shadow-header)',
        'soft-soft': 'var(--shadow-soft)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        'out': 'ease-out',
        'in': 'ease-in',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.6' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['20px', { lineHeight: '1.4' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['28px', { lineHeight: '1.2' }],
        '4xl': ['32px', { lineHeight: '1.1' }],
        hero: ['48px', { lineHeight: '1.1' }],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
        'slide-down': 'slide-down 200ms ease-out',
        'scale-in': 'scale-in 150ms ease-out',
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config