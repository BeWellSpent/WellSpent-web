'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import Box from '@mui/material/Box'
import { useIsFreeTier } from '@/hooks/useUserPlan'

const PUBLISHER_ID = 'ca-pub-8875066498176869'

interface Props {
  slot?: string
  format?: 'auto' | 'rectangle' | 'horizontal'
  style?: React.CSSProperties
}

export function AdBanner({ slot = '', format = 'auto', style }: Props) {
  const isFree = useIsFreeTier()
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (!isFree || pushed.current) return
    try {
      const adsbygoogle = (window as { adsbygoogle?: object[] }).adsbygoogle ?? []
      ;(adsbygoogle as object[]).push({})
      pushed.current = true
    } catch {
      // AdSense not loaded yet — Script onLoad will handle it
    }
  }, [isFree])

  if (!isFree) return null

  return (
    <>
      <Script
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`}
        strategy="lazyOnload"
        crossOrigin="anonymous"
        onLoad={() => {
          if (pushed.current) return
          try {
            const adsbygoogle = (window as { adsbygoogle?: object[] }).adsbygoogle ?? []
            ;(adsbygoogle as object[]).push({})
            pushed.current = true
          } catch { /* ignore */ }
        }}
      />
      <Box
        component="ins"
        ref={adRef}
        className="adsbygoogle"
        sx={{ display: 'block', ...style }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </>
  )
}
