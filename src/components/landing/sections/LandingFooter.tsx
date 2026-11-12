'use client'

import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import { CONTAINER_SX, SECTION_IDS } from '../landingStyles'

export function LandingFooter() {
  const t = useTranslations('landing.footer')
  const nav = useTranslations('landing.nav')
  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', mt: 'auto' }}>
      <Box sx={{ ...CONTAINER_SX, pt: 4, pb: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, fontSize: 14, color: 'text.secondary' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="img" src="/mark-color.png" alt="" sx={{ width: 32, height: 32 }} />
          <span>{t('tagline', { year: new Date().getFullYear() })}</span>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
          <Box component="a" href={`#${SECTION_IDS.features}`} sx={{ color: 'text.primary', textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>{nav('features')}</Box>
          <Box component="a" href={`#${SECTION_IDS.pricing}`} sx={{ color: 'text.primary', textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>{nav('pricing')}</Box>
        </Box>
      </Box>
    </Box>
  )
}
