import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')

  return {
    envDir: '../',
    plugins: [
      react(),
      tailwindcss(),
    ],
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: `http://localhost:${env.PORT || 8080}`,
          changeOrigin: true,
        },
      },
    },
  }
})
