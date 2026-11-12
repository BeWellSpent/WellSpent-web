'use client'

import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import { TierTag } from '../TierTag'
import { FeatureGroupCard } from '../features/FeatureGroupCard'
import { FEATURE_GROUPS } from '../features/featureGroups'
import { ANCHOR_SX, CONTAINER_SX, EYEBROW_SX, H2_SX, SECTION_IDS } from '../landingStyles'

export function FeaturesSection() {
  const t = useTranslations('landing.features')
  return (
    <Box
      component="section"
      id={SECTION_IDS.features}
      aria-labelledby="features-title"
      sx={{ ...CONTAINER_SX, ...ANCHOR_SX, py: 9, display: 'flex', flexDirection: 'column', gap: 3.5 }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Box component="span" sx={EYEBROW_SX}>{t('eyebrow')}</Box>
          <Box component="h2" id="features-title" sx={H2_SX}>{t('title')}</Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, fontSize: 14, color: 'text.secondary' }}>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><TierTag tier="free" />{t('legendFree')}</Box>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><TierTag tier="limited" />{t('legendLimited')}</Box>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><TierTag tier="pro" />{t('legendPro')}</Box>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(330px, 100%), 1fr))', gap: 2 }}>
        {FEATURE_GROUPS.map((group) => (
          <FeatureGroupCard key={group.key} group={group} />
        ))}
      </Box>
    </Box>
  )
}
