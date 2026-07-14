'use client'

import { useState, useEffect } from 'react'

export type ViewMode = 'split' | 'tabbed'

const STORAGE_KEY = 'wellspent_view_mode'

export function useViewPreference(defaultMode: ViewMode = 'tabbed'): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(defaultMode)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'split' || stored === 'tabbed') setMode(stored)
  }, [])

  function updateMode(newMode: ViewMode) {
    setMode(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)
  }

  return [mode, updateMode]
}
