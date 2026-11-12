'use client'

import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import { ComparisonList } from '../pricing/ComparisonList'
import { ComparisonTable } from '../pricing/ComparisonTable'
import { PlanCard } from '../pricing/PlanCard'
import { FREE_ITEMS, PRO_ITEMS } from '../pricing/plans'
import { ANCHOR_SX, BAND_SX, CONTAINER_SX, EYEBROW_SX, H2_SX, SECTION_IDS } from '../landingStyles'

export function PricingSection() {
  const t = useTranslations('landing.pricing')
  return (
    <Box component="section" id={SECTION_IDS.pricing} aria-labelledby="pricing-title" sx={{ ...BAND_SX, ...ANCHOR_SX }}>
      <Box sx={{ ...CONTAINER_SX, py: { xs: 7, md: 9 }, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Box component="span" sx={EYEBROW_SX}>{t('eyebrow')}</Box>
          <Box component="h2" id="pricing-title" sx={H2_SX}>{t('title')}</Box>
          <Box component="p" sx={{ m: 0, fontSize: 17, lineHeight: 1.5, color: 'text.secondary' }}>{t('subtitle')}</Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 2 }}>
          <PlanCard
            name={t('free.name')}
            price={t('free.price')}
            per={t('free.per')}
            tagline={t('free.tagline')}
            items={FREE_ITEMS.map((k) => t(`freeItems.${k}`))}
          />
          <PlanCard
            dark
            name={t('pro.name')}
            badge={t('pro.badge')}
            price={t('pro.price')}
            per={t('pro.per')}
            tagline={t('pro.tagline')}
            items={PRO_ITEMS.map((k) => t(`proItems.${k}`))}
          />
        </Box>
        <ComparisonTable />
        <ComparisonList />
      </Box>
    </Box>
  )
}
