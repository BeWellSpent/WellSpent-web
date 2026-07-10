'use client'

import { useCallback, useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface Props {
  value: number
  onChange: (n: number) => void
  min: number
  max: number
  itemHeight?: number
  visibleCount?: number
  'aria-label'?: string
}

export function clampNumber(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function indexForValue(value: number, min: number, max: number): number {
  return clampNumber(value, min, max) - min
}

export function indexFromScrollTop(scrollTop: number, itemHeight: number, maxIndex: number): number {
  const idx = Math.round(scrollTop / itemHeight)
  return Math.min(maxIndex, Math.max(0, idx))
}

/**
 * A touch/mouse-scrollable number wheel built on CSS scroll-snap — no extra
 * dependency. Chosen over a plain increment/decrement stepper so flicking
 * through a wide range (e.g. 1-52 for weeks) is fast.
 */
export function ScrollNumberPicker({ value, onChange, min, max, itemHeight = 40, visibleCount = 3, ...rest }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const padding = Math.floor(visibleCount / 2) * itemHeight

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const target = indexForValue(value, min, max) * itemHeight
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: 'auto' })
    }
  }, [value, min, max, itemHeight])

  const handleScrollEnd = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const idx = indexFromScrollTop(el.scrollTop, itemHeight, numbers.length - 1)
    const n = min + idx
    el.scrollTo({ top: idx * itemHeight, behavior: 'smooth' })
    if (n !== value) onChange(n)
  }, [itemHeight, min, numbers.length, onChange, value])

  function handleScroll() {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(handleScrollEnd, 120)
  }

  function selectValue(n: number) {
    const el = containerRef.current
    if (el) el.scrollTo({ top: indexForValue(n, min, max) * itemHeight, behavior: 'smooth' })
    onChange(n)
  }

  return (
    <Box
      ref={containerRef}
      role="listbox"
      aria-label={rest['aria-label']}
      onScroll={handleScroll}
      sx={{
        position: 'relative',
        width: 88,
        height: itemHeight * visibleCount,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ height: padding }} />
      {numbers.map((n) => (
        <Box
          key={n}
          role="option"
          aria-selected={n === value}
          onClick={() => selectValue(n)}
          sx={{
            height: itemHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            scrollSnapAlign: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <Typography
            variant={n === value ? 'h6' : 'body1'}
            color={n === value ? 'text.primary' : 'text.secondary'}
            fontWeight={n === value ? 600 : 400}
          >
            {n}
          </Typography>
        </Box>
      ))}
      <Box sx={{ height: padding }} />
    </Box>
  )
}
