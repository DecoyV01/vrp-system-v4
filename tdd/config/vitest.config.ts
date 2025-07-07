import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', 'convex'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        'src/components/ui/**', // shadcn/ui components (already tested)
        'src/main.tsx',
        'src/vite-env.d.ts'
      ]
    },
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './test-results/index.html'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../frontend/src'),
      '@/components': path.resolve(__dirname, '../frontend/src/components'),
      '@/hooks': path.resolve(__dirname, '../frontend/src/hooks'),
      '@/lib': path.resolve(__dirname, '../frontend/src/lib'),
      '@/pages': path.resolve(__dirname, '../frontend/src/pages'),
      '@/stores': path.resolve(__dirname, '../frontend/src/stores'),
      '@/utils': path.resolve(__dirname, '../frontend/src/utils')
    }
  }
})