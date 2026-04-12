import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // localhost → ::1 trên Windows hay gây ECONNREFUSED khi Nest bind IPv4
        target: 'http://127.0.0.1:3173',
        changeOrigin: true,
      },
    },
  },
})
