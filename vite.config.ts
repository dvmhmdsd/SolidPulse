import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [solid()],
  server: { port: 3000 },
  build: { target: 'esnext' },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
