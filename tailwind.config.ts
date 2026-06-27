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
        'chart-1': '#6366f1',
        'chart-2': '#10b981',
        'chart-3': '#0ea5e9',
        'chart-4': '#f59e0b',
        'chart-5': '#f43f5e',
        'chart-6': '#8b5cf6',
        'chart-7': '#14b8a6',
        'chart-8': '#e879f9',
        surface: '#0f172a',
        'surface-elevated': '#1e293b',
        border: '#334155',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
