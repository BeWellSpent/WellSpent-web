'use client'

import { useState, useMemo } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeContextProvider, useThemeMode } from '@/context/ThemeContext'

function ThemedApp({ children }: { children: React.ReactNode }) {
  const { effective } = useThemeMode()
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: effective,
          primary: { main: '#1565c0' },
          secondary: { main: '#2e7d32' },
        },
        shape: { borderRadius: 8 },
      }),
    [effective]
  )
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'mui' })
    cache.compat = true
    const prevInsert = cache.insert.bind(cache)
    let inserted: string[] = []
    cache.insert = (...args) => {
      const [, serialized] = args
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name)
      }
      return prevInsert(...args)
    }
    const flush = () => {
      const prev = inserted
      inserted = []
      return prev
    }
    return { cache, flush }
  })

  useServerInsertedHTML(() => {
    const names = flush()
    if (names.length === 0) return null
    let styles = ''
    for (const name of names) {
      styles += cache.inserted[name]
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    )
  })

  return (
    <CacheProvider value={cache}>
      <ThemeContextProvider>
        <ThemedApp>{children}</ThemedApp>
      </ThemeContextProvider>
    </CacheProvider>
  )
}
