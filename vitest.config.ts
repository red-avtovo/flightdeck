import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80 },
      exclude: [
        'src/test/**',
        '**/*.d.ts',
        'src/main.tsx',
        '**/*.stories.tsx',
        'src/App.tsx',
        'tailwind.config.ts',
        'postcss.config.js',
        'vite.config.ts',
        'vitest.config.ts',
      ],
    },
  },
})
