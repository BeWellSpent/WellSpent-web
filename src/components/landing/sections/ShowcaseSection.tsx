'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'
import { SECTION_SX } from '../constants'
import { SHOWCASE } from '../showcase/showcaseAssets'
import { ShowcaseFrame } from '../showcase/ShowcaseFrame'

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
          <Box
            key={key}
            sx={{
              display: 'flex',
              // Alternating sides on desktop; on mobile the capture always
              // leads, since the copy makes little sense before you've seen it.
              flexDirection: { xs: 'column', md: index % 2 === 1 ? 'row-reverse' : 'row' },
              alignItems: 'center',
              gap: { xs: 3, md: 6 },
              mb: { xs: 7, md: 10 },
              '&:last-of-type': { mb: 0 },
            }}
          >
            <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
              <ShowcaseFrame
                src={src}
                alt={t(`showcase.items.${key}.title`)}
                placeholderLabel={t(`showcase.items.${key}.title`)}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {t(`showcase.items.${key}.title`)}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {t(`showcase.items.${key}.desc`)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Container>
    </Box>
  )
}
