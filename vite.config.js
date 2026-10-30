import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const CSP_PRODUKSI = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'none'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ')

function sisipkanCspProduksi() {
  return {
    name: 'sisipkan-csp-produksi',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: CSP_PRODUKSI,
          },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), sisipkanCspProduksi()],
  server: {
    port: 5173,
    open: true,
  },
})
