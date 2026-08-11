'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import { useLocale, useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'
import { PricingCard } from '../pricing/PricingCard'

/** Key stems under `landing.pricing.<plan>.features`. */
const FREE_FEATURES = ['people', 'income', 'alerts', 'core'] as const
const PRO_FEATURES = ['unlimited', 'bankSync', 'alerts', 'noAds'] as const

export function PricingSection() {
  const t = useTranslations('landing')
  const locale = useLocale()

  return (
    <Box id="pricing" sx={{ ...SECTION_SX, bgcolor: 'primary.main' }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom color="white">
            {t('pricing.title')}
          </Typography>
          <Typography variant="subtitle1" color="rgba(255,255,255,0.85)">
            {t('pricing.subtitle')}
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} sm={6}>
            <PricingCard
              name={t('pricing.free.name')}
              price={t('pricing.free.price')}
              tagline={t('pricing.free.tagline')}
              features={FREE_FEATURES.map((key) => t(`pricing.free.features.${key}`))}
              cta={{ label: t('pricing.free.cta'), href: `/${locale}/register` }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <PricingCard
              name={t('pricing.pro.name')}
              price={t('pricing.pro.price')}
              tagline={t('pricing.pro.tagline')}
              features={PRO_FEATURES.map((key) => t(`pricing.pro.features.${key}`))}
            />
          </Grid>
        </Grid>

        <Typography
          variant="body2"
          sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', mt: 4, maxWidth: 560, mx: 'auto' }}
        >
          {t('pricing.note')}
        </Typography>
      </Container>
    </Box>
  )
}
