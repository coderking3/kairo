import { defineConfig } from '@king-3/eslint-config'

export default defineConfig(
  {
    type: 'lib',
    typescript: true,
    ignores: ['./docs/**/*']
  },
  {
    rules: {
      'no-console': 'off',
      'antfu/no-import-dist': 'off'
    }
  }
)
