import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'kairo/jsx-dev-runtime',
        replacement: resolve(__dirname, '../../src/jsx-dev-runtime.ts')
      },
      {
        find: 'kairo/jsx-runtime',
        replacement: resolve(__dirname, '../../src/jsx-runtime.ts')
      },
      { find: 'kairo', replacement: resolve(__dirname, '../../src/index.ts') }
    ]
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'kairo'
  }
})
