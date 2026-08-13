'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Alert, Box, Button, IconButton, Collapse } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useStatusBanner } from './useStatusBanner'
import { bannerMessage, bannerTone, isDismissible } from './severity'

/**
 * The operator-authored status strip at the very top of every page.
 *
 * Mounted in the locale layout, so it sits above the landing page, login, and
 * the authenticated app alike — it reads from a public RPC precisely so a
 * signed-out visitor sees it too.
 */
export function StatusBanner() {
  const t = useTranslations('statusBanner')
  const locale = useLocale()
  const { banner, dismiss } = useStatusBanner()

  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const textRef = useRef<HTMLDivElement | null>(null)

  // Whether the message actually overflows one line is a layout question, not
  // a character count: the same text fits on a desktop and wraps on a phone.
  // Measured rather than guessed, and re-measured on resize and rotation.
  const measure = useCallback(() => {
    const el = textRef.current
    if (!el) return
    setIsTruncated(el.scrollWidth > el.clientWidth + 1)
  }, [])

  useLayoutEffect(() => {
    if (expanded) return
    measure()
  }, [measure, expanded, banner, locale])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // Collapse when the banner itself changes, so a new message never inherits
  // the previous one's expanded state.
  useEffect(() => setExpanded(false), [banner?.id])

  if (!banner) return null

  const tone = bannerTone(banner.severity)
  const message = bannerMessage(banner, locale)
  const canDismiss = isDismissible(banner.severity)
  const canExpand = isTruncated || expanded

  return (
    <Collapse in appear>
      <Alert
        severity={tone}
        square
        role="status"
        sx={{
          borderRadius: 0,
          alignItems: 'center',
          // Sits above MUI's drawers and app bars so it is never covered by
          // the sidebar or a management drawer on mobile.
          position: 'relative',
          zIndex: (theme) => theme.zIndex.drawer + 2,
          '& .MuiAlert-message': { flex: 1, minWidth: 0, py: 0.5 },
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            {canExpand && (
              <Button
                size="small"
                color="inherit"
                onClick={() => setExpanded((prev) => !prev)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {expanded ? t('showLess') : t('learnMore')}
              </Button>
            )}
            {canDismiss && (
              <IconButton size="small" color="inherit" onClick={dismiss} aria-label={t('dismiss')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        }
      >
        <Box
          ref={textRef}
          sx={
            expanded
              ? { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }
              : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
          }
        >
          {message}
        </Box>
      </Alert>
    </Collapse>
  )
}
