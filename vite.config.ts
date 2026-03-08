import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [solid()],
  // base must match the GitHub repo name for Pages deployments.
  // In dev (pnpm dev) Vite ignores this; in prod builds it prefixes all asset URLs.
  base: '/SolidPulse/',
  server: { port: 3000 },
  build: { target: 'esnext' },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
