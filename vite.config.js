import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Comparte dominio con la landing del webinar (recursos.atvos.io): los archivos van bajo /mkt/
// para no chocar con sus /assets/. Las páginas siguen siendo /video y /biblioteca.
// En local, /api/contenido va al backend de ATV Ops.
const OPS = process.env.OPS_API || 'http://localhost:8010'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/mkt/' : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/contenido': {
        target: OPS,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/contenido/, '/api/recursos-publicos'),
      },
    },
  },
}))
