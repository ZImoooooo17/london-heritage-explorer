import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/london-heritage-explorer/',
  server: {
    allowedHosts: true,
  },
})