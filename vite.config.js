import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin the dev server to a single known port. strictPort makes Vite exit
    // with a clear "port already in use" error instead of silently shifting
    // to 5174/5175 — a shifted port used to break CORS and make login/register
    // fail with no obvious cause. One instance, one predictable URL.
    port: 5173,
    strictPort: true,
  },
})
