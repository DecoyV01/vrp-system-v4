import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '../convex/_generated': path.resolve(__dirname, '../convex/_generated'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2015',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          convex: ['convex'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
          ],
          'design-system': [
            'tailwindcss',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],
          'theme-provider': ['@/components/theme/ThemeProvider'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
