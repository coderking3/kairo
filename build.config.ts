import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: [
        './src/index.ts',
        './src/jsx-runtime.ts',
        './src/jsx-dev-runtime.ts'
      ]
    }
  ]
})
