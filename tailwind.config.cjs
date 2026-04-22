/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          bg: '#0a0a0a',
          surface: '#171717',
          border: '#262626',
          muted: '#78716c',
          text: '#e5e5e5',
        },
        accent: {
          primary: '#3b82f6',
          error: '#ef4444',
          success: '#22c55e',
        },
      },
      fontFamily: {
        display: ['Satoshi', 'sans-serif'],
        sans: ['Instrument Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
      },
    },
  },
  plugins: [],
}
