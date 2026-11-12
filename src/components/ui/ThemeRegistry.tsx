'use client'

import { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  experimental_extendTheme as extendTheme,
} from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

/** The iOS app's palette, so the site and the app read as one product. */
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#2F4BD8' },
        success: { main: '#0B7A4B' },
        warning: { main: '#A15C07' },
        error: { main: '#C2361F' },
        background: { default: '#F4F5F7', paper: '#FFFFFF' },
        text: { primary: '#101828', secondary: '#5D6679' },
        divider: '#E6E8EC',
      },
    },
    dark: {
      palette: {
        primary: { main: '#7C93FF' },
        success: { main: '#4CC38A' },
        warning: { main: '#E3A84B' },
        error: { main: '#F07A66' },
        background: { default: '#0B0F17', paper: '#161B26' },
        text: { primary: '#F2F4F7', secondary: '#A3ACBD' },
        divider: '#262D3B',
      },
    },
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
})

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
      <CssVarsProvider theme={theme} defaultMode="system" modeStorageKey="theme-mode">
        <CssBaseline />
        {children}
      </CssVarsProvider>
    </CacheProvider>
  )
}
