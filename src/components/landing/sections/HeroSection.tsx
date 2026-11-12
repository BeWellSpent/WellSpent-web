'use client'

import Box from '@mui/material/Box'
import CheckIcon from '@mui/icons-material/Check'
import { useTranslations } from 'next-intl'
import { AppStoreButton } from '../AppStoreButton'
import { PhoneMockup } from '../hero/PhoneMockup'
import { CONTAINER_SX, SECTION_IDS } from '../landingStyles'

export function HeroSection() {
  const t = useTranslations('landing.hero')
  return (
    <Box
      component="section"
      aria-labelledby="hero-title"
      sx={{ ...CONTAINER_SX, pt: { xs: 6, md: 8 }, pb: { xs: 7, md: 9 }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 5, md: 6 } }}
    >
      <Box sx={{ flex: '1 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box
          component="span"
          sx={{ alignSelf: 'flex-start', height: 30, px: 1.5, borderRadius: '15px', bgcolor: 'rgba(11,122,75,0.12)', color: 'success.main', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
        >
          <CheckIcon aria-hidden sx={{ fontSize: 14 }} />
          {t('badge')}
        </Box>
        <Box
          component="h1"
          id="hero-title"
          sx={{ m: 0, fontSize: { xs: 40, md: 64 }, lineHeight: 1.04, fontWeight: 800, letterSpacing: '-0.035em' }}
        >
          {t('title')}
        </Box>
        <Box component="p" sx={{ m: 0, maxWidth: 520, fontSize: 19, lineHeight: 1.5, color: 'text.secondary' }}>
          {t('body')}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.5 }}>
          <AppStoreButton />
          <Box
            component="a"
            href={`#${SECTION_IDS.features}`}
            sx={{ height: 56, px: '22px', border: 1, borderColor: 'divider', borderRadius: '14px', bgcolor: 'background.paper', color: 'text.primary', fontSize: 16, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            {t('seeInside')}
          </Box>
        </Box>
        <Box component="p" sx={{ m: 0, fontSize: 14, color: 'text.secondary' }}>{t('platforms')}</Box>
      </Box>
      <Box sx={{ flex: '1 1 340px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
        <PhoneMockup />
      </Box>
    </Box>
  )
}
