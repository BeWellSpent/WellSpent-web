'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

const ThemeCtx = createContext<{
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  effective: 'light' | 'dark'
}>({ mode: 'system', setMode: () => {}, effective: 'light' })

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme-mode') as ThemeMode | null
    if (saved) setModeState(saved)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(mq.matches)
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])

  function setMode(m: ThemeMode) {
    setModeState(m)
    localStorage.setItem('theme-mode', m)
  }

  const effective: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    const isDark = effective === 'dark'
    document.body.style.backgroundColor = isDark ? '#121212' : ''
    document.body.style.color = isDark ? 'rgba(255,255,255,0.87)' : ''
    document.documentElement.style.colorScheme = effective
  }, [effective])

  return <ThemeCtx.Provider value={{ mode, setMode, effective }}>{children}</ThemeCtx.Provider>
}

export function useThemeMode() {
  return useContext(ThemeCtx)
}
