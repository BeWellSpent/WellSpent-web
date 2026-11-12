'use client'

import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import { APP_STORE_URL } from '@/lib/appStore'

function AppleGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9zM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
    </svg>
  )
}

/** "Download on the App Store" once the listing exists, a non-link "Coming soon" until then. */
export function AppStoreButton() {
  const t = useTranslations('landing.appStore')
  const live = APP_STORE_URL !== ''

  return (
    <Box
      component={live ? 'a' : 'span'}
      href={live ? APP_STORE_URL : undefined}
      sx={{
        height: 56,
        px: '22px',
        borderRadius: '14px',
        bgcolor: '#101828',
        color: '#FFFFFF',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <AppleGlyph />
      <Box component="span" sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <Box component="span" sx={{ fontSize: 11 }}>{live ? t('downloadOnThe') : t('comingSoonTo')}</Box>
        <Box component="span" sx={{ fontSize: 18, fontWeight: 600 }}>{t('appStore')}</Box>
      </Box>
    </Box>
  )
}
