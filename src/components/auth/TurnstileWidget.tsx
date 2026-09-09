'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import Script from 'next/script'
import Box from '@mui/material/Box'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

/** Turnstile's global API, attached to `window` once its script loads. */
interface TurnstileGlobal {
  render: (container: HTMLElement, options: {
    sitekey: string
    callback: (token: string) => void
    'expired-callback'?: () => void
    'error-callback'?: () => void
  }) => string
  reset: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal
  }
}

export interface TurnstileWidgetHandle {
  /** Turnstile tokens are single-use — call after a failed submit so the
   * next attempt gets a fresh one instead of resending an already-consumed
   * (or expired) token. */
  reset: () => void
}

interface Props {
  onToken: (token: string) => void
}

/**
 * Cloudflare Turnstile captcha widget, on the Register form. Uses explicit
 * rendering (`?render=explicit` + `window.turnstile.render`) rather than
 * Turnstile's implicit auto-render-by-class-name mode, since the parent form
 * needs an imperative reset() after a failed submit.
 *
 * Loading pattern mirrors `ads/AdBanner.tsx`: a `next/script` tag plus a
 * guarded render-once effect, so it works whether the script finishes
 * loading before or after this component mounts. One deliberate difference:
 * `afterInteractive`, not `lazyOnload` — an ad is decorative and can wait for
 * browser idle time, but this widget has to actually resolve before the form
 * can be submitted, so it loads promptly instead.
 */
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, Props>(function TurnstileWidget(
  { onToken },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const renderedRef = useRef(false)

  const render = () => {
    if (renderedRef.current || !containerRef.current || !window.turnstile) return
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: onToken,
      'expired-callback': () => onToken(''),
      'error-callback': () => onToken(''),
    })
    renderedRef.current = true
  }

  useEffect(() => {
    render()
    // Only ever render once per mount — re-running on an onToken identity
    // change would try to re-render into an already-populated container.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
      onToken('')
    },
  }))

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={render}
      />
      <Box ref={containerRef} />
    </>
  )
})
