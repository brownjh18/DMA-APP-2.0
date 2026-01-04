/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Backend server
        changeOrigin: true,
        secure: false,
        timeout: 60000, // 60 second timeout for file uploads
        proxyTimeout: 60000,
      },
      '/uploads': {
        target: 'http://localhost:5000', // Backend server for media files
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
      }
    }
  }
})
