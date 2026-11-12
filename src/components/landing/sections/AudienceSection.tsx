'use client'

import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import { CARD_SX, CONTAINER_SX, H2_SX } from '../landingStyles'

const AUDIENCES = ['couples', 'freelancers', 'paydays'] as const

export function AudienceSection() {
  const t = useTranslations('landing.audience')
  return (
    <Box component="section" aria-labelledby="audience-title" sx={{ ...CONTAINER_SX, py: { xs: 7, md: 9 }, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      <Box component="h2" id="audience-title" sx={H2_SX}>{t('title')}</Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2 }}>
        {AUDIENCES.map((key) => (
          <Box key={key} sx={{ ...CARD_SX, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box component="h3" sx={{ m: 0, fontSize: 18, fontWeight: 700 }}>{t(`items.${key}.title`)}</Box>
            <Box component="p" sx={{ m: 0, fontSize: 15, lineHeight: 1.55, color: 'text.secondary' }}>{t(`items.${key}.body`)}</Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
