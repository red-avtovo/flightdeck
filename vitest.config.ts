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
        // Build artifacts: CI runs coverage in a clean checkout, but locally
        // (e.g. the pre-commit hook, or after `pnpm build`) these dirs exist and
        // v8 would otherwise count their bundled JS, sinking coverage below 80%.
        'dist/**',
        'storybook-static/**',
        'coverage/**',
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
