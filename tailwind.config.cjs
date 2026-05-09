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
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          border: 'var(--border)',
          muted: 'var(--muted)',
          text: 'var(--text)',
        },
        accent: {
          primary: 'var(--accent)',
          error: 'var(--error)',
          success: 'var(--success)',
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