import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'autonomy-autonomous': '#10b981',
        'autonomy-assisted': '#0ea5e9',
        'autonomy-rescued': '#f59e0b',
        'autonomy-failed': '#f43f5e',
        'chart-1': '#f97316',
        'chart-2': '#22c55e',
        'chart-3': '#6366f1',
        'chart-4': '#f59e0b',
        'chart-5': '#ef4444',
        'chart-6': '#a78bfa',
        'chart-7': '#14b8a6',
        'chart-8': '#fb7185',
        brand: '#f97316',
        'brand-light': '#fb923c',
        'brand-dark': '#ea6c00',
        slate: {
          50:  '#faf6f2',
          100: '#f0ece6',
          200: '#e2dbd3',
          300: '#c8bfb5',
          400: '#a89f96',
          500: '#8a8078',
          600: '#6b6460',
          700: '#504a45',
          800: '#3a3530',
          900: '#252220',
          950: '#1a1714',
        },
        surface: '#201e1b',
        'surface-elevated': '#252220',
        border: '#3a3530',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
