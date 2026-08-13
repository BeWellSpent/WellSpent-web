'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'
import { SHOWCASE } from '../showcase/showcaseAssets'
import { AlternatingMediaRow } from '../showcase/AlternatingMediaRow'

/**
 * The four views a visitor most needs to picture before signing up, in the
 * order the product itself is used: see the plan, set the plan, then record
 * what actually happens against it.
 */
const SHOWCASE_ITEMS = [
  { key: 'overview', src: SHOWCASE.overview },
  { key: 'plan', src: SHOWCASE.plan },
  { key: 'fixed', src: SHOWCASE.fixed },
  { key: 'variable', src: SHOWCASE.variable },
] as const

export function ShowcaseSection() {
  const t = useTranslations('landing')

  return (
    <Box sx={{ ...SECTION_SX, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('showcase.title')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto' }}>
            {t('showcase.subtitle')}
          </Typography>
        </Box>

        {SHOWCASE_ITEMS.map(({ key, src }, index) => (
          <AlternatingMediaRow
            key={key}
            src={src}
            title={t(`showcase.items.${key}.title`)}
            desc={t(`showcase.items.${key}.desc`)}
            reversed={index % 2 === 1}
          />
        ))}
      </Container>
    </Box>
  )
}
