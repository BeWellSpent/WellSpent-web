'use client'

import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import { ANCHOR_SX, BAND_SX, CONTAINER_SX, EYEBROW_SX, H2_SX, SECTION_IDS } from '../landingStyles'

const STEPS = ['income', 'plan', 'track'] as const

export function HowItWorksSection() {
  const t = useTranslations('landing.how')
  return (
    <Box component="section" id={SECTION_IDS.how} aria-labelledby="how-title" sx={{ ...BAND_SX, ...ANCHOR_SX }}>
      <Box sx={{ ...CONTAINER_SX, py: 9, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Box component="span" sx={EYEBROW_SX}>{t('eyebrow')}</Box>
          <Box component="h2" id="how-title" sx={H2_SX}>{t('title')}</Box>
        </Box>
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2 }}>
          {STEPS.map((step, index) => (
            <Box component="li" key={step} sx={{ p: 3, bgcolor: 'background.default', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Box
                aria-hidden
                sx={{ width: 36, height: 36, borderRadius: '18px', bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {index + 1}
              </Box>
              <Box component="h3" sx={{ m: 0, mt: 0.5, fontSize: 20, fontWeight: 700 }}>{t(`steps.${step}.title`)}</Box>
              <Box component="p" sx={{ m: 0, fontSize: 15, lineHeight: 1.55, color: 'text.secondary' }}>{t(`steps.${step}.body`)}</Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
