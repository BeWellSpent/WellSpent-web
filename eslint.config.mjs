import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals')

export default [
  ...nextCoreWebVitals,
  {
    ignores: ['src/gen/**'],
  },
  {
    rules: {
      // react-hooks v5 introduced these rules; our patterns are legitimate:
      // - set-state-in-effect: localStorage sync on mount, syncing state with props
      // - refs: ref accessed in a stored callback (QueryCache.onError), not during render
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
    },
  },
]
